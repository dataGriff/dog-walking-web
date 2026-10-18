import { redirect } from '@sveltejs/kit';
import { actionFail, api, loadError, str } from '$lib/server/api';
import { CANCELLATION_REASONS, localInputToIso, type CancellationReason } from '$lib/api';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async (event) => {
	const { walks, clients } = await api(event);
	const [walkRes, dogsRes] = await Promise.all([
		walks.GET('/walks/{walk_id}', { params: { path: { walk_id: event.params.walk_id } } }),
		clients.GET('/dogs')
	]);
	if (walkRes.error || !walkRes.data) loadError(walkRes.response.status, walkRes.error);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);
	return { walk: walkRes.data, dogs: dogsRes.data.dogs };
};

/** Where to land after a lifecycle action: the caller's page, or this walk. */
function afterAction(event: RequestEvent): never {
	const back = event.url.searchParams.get('redirect_to');
	redirect(303, back && back.startsWith('/') ? back : `/walks/${event.params.walk_id}`);
}

export const actions: Actions = {
	update: async (event) => {
		const data = await event.request.formData();
		const scheduledLocal = str(data, 'scheduled_at');
		const durationRaw = str(data, 'duration_minutes');
		const dog_ids = data.getAll('dog_ids').map(String).filter(Boolean);
		const body = {
			scheduled_at: scheduledLocal ? localInputToIso(scheduledLocal) : undefined,
			duration_minutes: durationRaw ? Number(durationRaw) : undefined,
			dog_ids: dog_ids.length ? dog_ids : undefined,
			notes: str(data, 'notes')
		};
		const { walks } = await api(event);
		const res = await walks.PATCH('/walks/{walk_id}', { params: { path: { walk_id: event.params.walk_id } }, body });
		if (res.error || !res.data) return actionFail(res.response.status, res.error, { form: 'update' });
		return { updated: true };
	},
	start: async (event) => {
		const { walks } = await api(event);
		const res = await walks.POST('/walks/{walk_id}/start', { params: { path: { walk_id: event.params.walk_id } } });
		if (res.error || !res.data) return actionFail(res.response.status, res.error, { form: 'start' });
		afterAction(event);
	},
	complete: async (event) => {
		const data = await event.request.formData();
		const notes = str(data, 'notes');
		const { walks } = await api(event);
		const res = await walks.POST('/walks/{walk_id}/complete', {
			params: { path: { walk_id: event.params.walk_id } },
			body: notes ? { notes } : {}
		});
		if (res.error || !res.data) return actionFail(res.response.status, res.error, { form: 'complete' });
		afterAction(event);
	},
	cancel: async (event) => {
		const data = await event.request.formData();
		const reason = str(data, 'reason') as CancellationReason | undefined;
		if (!reason || !CANCELLATION_REASONS.some((r) => r.value === reason)) {
			return actionFail(400, { error_code: 'invalid_reason', message: 'Pick a reason.' }, { form: 'cancel' });
		}
		const { walks } = await api(event);
		const res = await walks.POST('/walks/{walk_id}/cancel', {
			params: { path: { walk_id: event.params.walk_id } },
			body: { reason }
		});
		if (res.error || !res.data) return actionFail(res.response.status, res.error, { form: 'cancel' });
		afterAction(event);
	}
};

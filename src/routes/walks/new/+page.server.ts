import { redirect } from '@sveltejs/kit';
import { actionFail, api, loadError, str } from '$lib/server/api';
import { localInputToIso } from '$lib/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { clients } = await api(event);
	const [dogsRes, clientsRes] = await Promise.all([clients.GET('/dogs'), clients.GET('/clients')]);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);
	if (clientsRes.error || !clientsRes.data) loadError(clientsRes.response.status, clientsRes.error);
	const owners = Object.fromEntries(clientsRes.data.clients.map((c) => [c.client_id, c.name]));
	return {
		dogs: dogsRes.data.dogs.map((d) => ({ ...d, owner: owners[d.client_id] ?? '' })),
		preselect: event.url.searchParams.getAll('dog_id')
	};
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const scheduledLocal = str(data, 'scheduled_at') ?? '';
		const duration = Number(str(data, 'duration_minutes') ?? 0);
		const dog_ids = data.getAll('dog_ids').map(String).filter(Boolean);
		const notes = str(data, 'notes');
		const values = { scheduled_at: scheduledLocal, duration_minutes: String(duration), dog_ids, notes };
		if (!scheduledLocal || Number.isNaN(new Date(scheduledLocal).getTime())) {
			return actionFail(400, { error_code: 'invalid_walk', message: 'Pick a date and time.' }, values);
		}
		const { walks } = await api(event);
		const res = await walks.POST('/walks', {
			body: { scheduled_at: localInputToIso(scheduledLocal), duration_minutes: duration, dog_ids, notes }
		});
		if (res.error || !res.data) return actionFail(res.response.status, res.error, values);
		redirect(303, `/walks/${res.data.walk_id}`);
	}
};

import { redirect } from '@sveltejs/kit';
import { actionFail, api, loadError, str } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { clients } = await api(event);
	const dogRes = await clients.GET('/dogs/{dog_id}', { params: { path: { dog_id: event.params.dog_id } } });
	if (dogRes.error || !dogRes.data) loadError(dogRes.response.status, dogRes.error);
	const clientRes = await clients.GET('/clients/{client_id}', {
		params: { path: { client_id: dogRes.data.client_id } }
	});
	return { dog: dogRes.data, owner: clientRes.data ?? null };
};

export const actions: Actions = {
	update: async (event) => {
		const data = await event.request.formData();
		const body = {
			name: str(data, 'name'),
			breed: str(data, 'breed'),
			date_of_birth: str(data, 'date_of_birth'),
			notes: str(data, 'notes')
		};
		const { clients } = await api(event);
		const res = await clients.PATCH('/dogs/{dog_id}', { params: { path: { dog_id: event.params.dog_id } }, body });
		if (res.error || !res.data) return actionFail(res.response.status, res.error, body);
		return { updated: true };
	},
	delete: async (event) => {
		const { clients } = await api(event);
		const dog = await clients.GET('/dogs/{dog_id}', { params: { path: { dog_id: event.params.dog_id } } });
		const res = await clients.DELETE('/dogs/{dog_id}', { params: { path: { dog_id: event.params.dog_id } } });
		if (res.response.status !== 204) return actionFail(res.response.status, res.error);
		redirect(303, dog.data ? `/clients/${dog.data.client_id}` : '/clients');
	}
};

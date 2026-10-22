import { redirect } from '@sveltejs/kit';
import { actionFail, api, loadError, str } from '$lib/server/api';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { clients } = await api(event);
	const [clientsRes, dogsRes] = await Promise.all([clients.GET('/clients'), clients.GET('/dogs')]);
	if (clientsRes.error || !clientsRes.data) loadError(clientsRes.response.status, clientsRes.error);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);
	const dogsByClient = new Map<string, { dog_id: string; name: string }[]>();
	for (const dog of dogsRes.data.dogs) {
		dogsByClient.set(dog.client_id, [...(dogsByClient.get(dog.client_id) ?? []), { dog_id: dog.dog_id, name: dog.name }]);
	}
	return {
		clients: clientsRes.data.clients.map((c) => ({ ...c, dogs: dogsByClient.get(c.client_id) ?? [] }))
	};
};

export const actions: Actions = {
	create: async (event) => {
		const data = await event.request.formData();
		const body = {
			name: str(data, 'name') ?? '',
			email: str(data, 'email'),
			phone: str(data, 'phone'),
			address: str(data, 'address'),
			notes: str(data, 'notes')
		};
		if (!body.name) {
			return actionFail(400, { error_code: 'invalid_client', message: 'Name is required.' }, { ...body, field: 'name' });
		}
		const { clients } = await api(event);
		const res = await clients.POST('/clients', { body });
		if (res.error || !res.data) return actionFail(res.response.status, res.error, body);
		redirect(303, `/clients/${res.data.client_id}`);
	}
};

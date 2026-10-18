import { api, loadError } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { walks, clients } = await api(event);
	const from = new Date();
	from.setUTCHours(0, 0, 0, 0);
	const to = new Date(from);
	to.setUTCDate(to.getUTCDate() + 7);

	const [walksRes, dogsRes] = await Promise.all([
		walks.GET('/walks', {
			params: { query: { scheduled_from: from.toISOString(), scheduled_to: to.toISOString() } }
		}),
		clients.GET('/dogs')
	]);
	if (walksRes.error || !walksRes.data) loadError(walksRes.response.status, walksRes.error);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);

	return {
		walks: walksRes.data.walks.filter((w) => w.status === 'scheduled' || w.status === 'in_progress'),
		dogNames: Object.fromEntries(dogsRes.data.dogs.map((d) => [d.dog_id, d.name])),
		dogCount: dogsRes.data.dogs.length
	};
};

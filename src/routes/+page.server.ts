import { api, loadError } from '$lib/server/api';
import { dayWindow, readTimeZone, todayKey } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { walks, clients } = await api(event);
	const tz = readTimeZone(event.cookies);
	const today = todayKey(tz);
	const { from, to } = dayWindow(today, 7, tz);

	const [walksRes, dogsRes] = await Promise.all([
		walks.GET('/walks', {
			params: { query: { scheduled_from: from, scheduled_to: to } }
		}),
		clients.GET('/dogs')
	]);
	if (walksRes.error || !walksRes.data) loadError(walksRes.response.status, walksRes.error);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);

	return {
		tz,
		today,
		walks: walksRes.data.walks.filter((w) => w.status === 'scheduled' || w.status === 'in_progress'),
		dogNames: Object.fromEntries(dogsRes.data.dogs.map((d) => [d.dog_id, d.name])),
		dogCount: dogsRes.data.dogs.length
	};
};

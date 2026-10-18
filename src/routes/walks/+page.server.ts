import { api, loadError } from '$lib/server/api';
import { WALK_STATUSES, todayKey, weekBounds, type WalkStatus } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const day = /^\d{4}-\d{2}-\d{2}$/.test(event.url.searchParams.get('week') ?? '')
		? event.url.searchParams.get('week')!
		: todayKey();
	const statusParam = event.url.searchParams.get('status') ?? '';
	const status = (WALK_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as WalkStatus) : undefined;
	const { from, to } = weekBounds(day);

	const { walks, clients } = await api(event);
	const [walksRes, dogsRes] = await Promise.all([
		walks.GET('/walks', { params: { query: { scheduled_from: from, scheduled_to: to, status } } }),
		clients.GET('/dogs')
	]);
	if (walksRes.error || !walksRes.data) loadError(walksRes.response.status, walksRes.error);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);

	return {
		day,
		weekStart: from.slice(0, 10),
		status: status ?? '',
		walks: walksRes.data.walks,
		dogNames: Object.fromEntries(dogsRes.data.dogs.map((d) => [d.dog_id, d.name]))
	};
};

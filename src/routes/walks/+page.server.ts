import { api, loadError } from '$lib/server/api';
import { WALK_STATUSES, readTimeZone, shiftDay, todayKey, weekBounds, type WalkStatus } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const tz = readTimeZone(event.cookies);
	const day = /^\d{4}-\d{2}-\d{2}$/.test(event.url.searchParams.get('week') ?? '')
		? event.url.searchParams.get('week')!
		: todayKey(tz);
	const statusParam = event.url.searchParams.get('status') ?? '';
	const status = (WALK_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as WalkStatus) : undefined;
	const { from, to } = weekBounds(day, tz);

	const { walks, clients } = await api(event);
	const [walksRes, dogsRes] = await Promise.all([
		walks.GET('/walks', { params: { query: { scheduled_from: from, scheduled_to: to, status } } }),
		clients.GET('/dogs')
	]);
	if (walksRes.error || !walksRes.data) loadError(walksRes.response.status, walksRes.error);
	if (dogsRes.error || !dogsRes.data) loadError(dogsRes.response.status, dogsRes.error);

	return {
		tz,
		day,
		weekStart: shiftDay(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7)),
		status: status ?? '',
		walks: walksRes.data.walks,
		dogNames: Object.fromEntries(dogsRes.data.dogs.map((d) => [d.dog_id, d.name]))
	};
};

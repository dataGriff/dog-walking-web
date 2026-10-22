import { api, loadError } from '$lib/server/api';
import { WALK_STATUSES, parseDayKey, readTimeZone, todayKey, weekBounds, weekStartKey, type WalkStatus } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const tz = readTimeZone(event.cookies);
	// A ?week that is not a real day (2026-13-01) falls back to this week.
	const day = parseDayKey(event.url.searchParams.get('week')) ?? todayKey(tz);
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
		weekStart: weekStartKey(day),
		status: status ?? '',
		walks: walksRes.data.walks,
		dogNames: Object.fromEntries(dogsRes.data.dogs.map((d) => [d.dog_id, d.name]))
	};
};

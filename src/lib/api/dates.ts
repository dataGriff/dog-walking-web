/** Date helpers over the contract's ISO 8601 `date-time` strings (UTC). */

/** Local calendar day (YYYY-MM-DD) of an instant, in the walker's timezone. */
export function localDayKey(iso: string, timeZone?: string): string {
	const d = new Date(iso);
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(d);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Group items carrying a `scheduled_at` by local day, days ascending, items ascending. */
export function groupByDay<T extends { scheduled_at: string }>(
	items: readonly T[],
	timeZone?: string
): { day: string; items: T[] }[] {
	const groups = new Map<string, T[]>();
	for (const item of [...items].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))) {
		const key = localDayKey(item.scheduled_at, timeZone);
		const bucket = groups.get(key) ?? [];
		bucket.push(item);
		groups.set(key, bucket);
	}
	return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, items]) => ({ day, items }));
}

export function formatTime(iso: string, locale?: string, timeZone?: string): string {
	return new Intl.DateTimeFormat(locale, { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function formatDay(dayKey: string, locale?: string): string {
	const [y, m, d] = dayKey.split('-').map(Number);
	return new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC'
	}).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatDateTime(iso: string, locale?: string, timeZone?: string): string {
	return new Intl.DateTimeFormat(locale, {
		timeZone,
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit'
	}).format(new Date(iso));
}

/** Monday 00:00 of the week containing `dayKey`, and the following Monday,
 * as UTC instants - midnight in `timeZone` (UTC when not given). */
export function weekBounds(dayKey: string, timeZone = 'UTC'): { from: string; to: string } {
	const [y, m, d] = dayKey.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	const dow = (date.getUTCDay() + 6) % 7; // Monday = 0
	const monday = shiftDay(dayKey, -dow);
	const next = shiftDay(monday, 7);
	return { from: zonedLocalToIso(`${monday}T00:00`, timeZone)!, to: zonedLocalToIso(`${next}T00:00`, timeZone)! };
}

/** `dayKey` 00:00 and `days` later 00:00 in `timeZone`, as UTC instants. */
export function dayWindow(dayKey: string, days: number, timeZone = 'UTC'): { from: string; to: string } {
	return {
		from: zonedLocalToIso(`${dayKey}T00:00`, timeZone)!,
		to: zonedLocalToIso(`${shiftDay(dayKey, days)}T00:00`, timeZone)!
	};
}

export function shiftDay(dayKey: string, days: number): string {
	const [y, m, d] = dayKey.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d + days));
	return date.toISOString().slice(0, 10);
}

export function todayKey(timeZone?: string): string {
	return localDayKey(new Date().toISOString(), timeZone);
}

/** The IANA zone to use for a request: the `tz` cookie the browser set when
 * it is a zone this runtime knows, else UTC. */
export function readTimeZone(cookies: { get(name: string): string | undefined }): string {
	const tz = cookies.get('tz');
	if (!tz) return 'UTC';
	try {
		return Intl.supportedValuesOf('timeZone').includes(tz) || tz === 'UTC' ? tz : 'UTC';
	} catch {
		return 'UTC';
	}
}

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** Offset of `timeZone` from UTC, in milliseconds, at the given instant. */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	}).formatToParts(new Date(utcMs));
	const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
	const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
	return asUtc - utcMs;
}

/** An `<input type="datetime-local">` value, read as wall-clock time in
 * `timeZone`, to the UTC ISO instant; null when it is not a date-time.
 * Two passes: guess the offset at the wall-clock-as-UTC instant, then
 * re-read it at the corrected instant so DST edges land right. */
export function zonedLocalToIso(local: string, timeZone: string): string | null {
	const m = LOCAL_INPUT.exec(local.trim());
	if (!m) return null;
	const [, y, mo, d, h, mi, sec] = m;
	const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec ?? '0'));
	if (Number.isNaN(wall)) return null;
	// Reject calendar overflow (e.g. 2026-13-45) that Date.UTC would roll over.
	const probe = new Date(wall);
	if (probe.getUTCMonth() !== Number(mo) - 1 || probe.getUTCDate() !== Number(d) || probe.getUTCHours() !== Number(h) || probe.getUTCMinutes() !== Number(mi)) {
		return null;
	}
	let offset: number;
	try {
		offset = zoneOffsetMs(wall, timeZone);
		offset = zoneOffsetMs(wall - offset, timeZone);
	} catch {
		return null;
	}
	return new Date(wall - offset).toISOString();
}

/** A UTC ISO instant to the `<input type="datetime-local">` value showing its wall-clock time in `timeZone`. */
export function isoToZonedLocal(iso: string, timeZone: string): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	}).formatToParts(new Date(iso));
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

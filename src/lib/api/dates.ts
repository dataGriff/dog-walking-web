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

/** Monday 00:00 UTC of the week containing `dayKey`, and the following Monday. */
export function weekBounds(dayKey: string): { from: string; to: string } {
	const [y, m, d] = dayKey.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d));
	const dow = (date.getUTCDay() + 6) % 7; // Monday = 0
	const monday = new Date(date);
	monday.setUTCDate(date.getUTCDate() - dow);
	const next = new Date(monday);
	next.setUTCDate(monday.getUTCDate() + 7);
	return { from: monday.toISOString(), to: next.toISOString() };
}

export function shiftDay(dayKey: string, days: number): string {
	const [y, m, d] = dayKey.split('-').map(Number);
	const date = new Date(Date.UTC(y, m - 1, d + days));
	return date.toISOString().slice(0, 10);
}

export function todayKey(timeZone?: string): string {
	return localDayKey(new Date().toISOString(), timeZone);
}

/** `<input type="datetime-local">` value (local wall clock, no zone) to the ISO instant. */
export function localInputToIso(value: string): string {
	return new Date(value).toISOString();
}

/** ISO instant to an `<input type="datetime-local">` value in the server's local time. */
export function isoToLocalInput(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

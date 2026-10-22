import { isoToZonedLocal, shiftDay, zonedLocalToIso } from '$lib/api';

export const DURATION_PRESETS = [30, 45, 60] as const;

/** The default start for a new walk, as a datetime-local value in `tz`:
 * 09:00 on `day` when one is given, else the next half hour from now. */
export function defaultStart(nowMs: number, tz: string, day?: string | null): string {
	if (day) return `${day}T09:00`;
	const next = Math.ceil((nowMs + 1) / 1_800_000) * 1_800_000;
	return isoToZonedLocal(new Date(next).toISOString(), tz);
}

/** The same wall-clock time seven days later, as a datetime-local value in `tz`
 * (stays at 09:00 across a DST change). */
export function sameTimeNextWeek(iso: string, tz: string): string {
	const local = isoToZonedLocal(iso, tz);
	return `${shiftDay(local.slice(0, 10), 7)}${local.slice(10)}`;
}

/** Duration from the preset chips: a preset value, or the custom field when "other". */
export function chosenDuration(choice: string | undefined, custom: string | undefined): number {
	const raw = choice === 'other' ? custom : choice;
	const n = Number(raw);
	return Number.isInteger(n) ? n : NaN;
}

export type ScheduleField = 'scheduled_at' | 'duration_minutes' | 'dog_ids' | 'notes';
const FIELDS: readonly ScheduleField[] = ['scheduled_at', 'duration_minutes', 'dog_ids', 'notes'];

/** Which field an API validation message is about: the API prefixes them
 * with the field path ("duration_minutes: must be at least 1"). */
export function fieldOf(message: string): ScheduleField | undefined {
	const prefix = message.split(':')[0]?.trim().split('.')[0];
	return FIELDS.find((f) => f === prefix);
}

/** Round trip check for a datetime-local value: is it a real time in `tz`? */
export function isValidLocal(value: string, tz: string): boolean {
	return zonedLocalToIso(value, tz) !== null;
}

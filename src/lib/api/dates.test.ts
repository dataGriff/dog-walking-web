import { describe, expect, it } from 'vitest';
import { groupByDay, isoToLocalInput, localDayKey, localInputToIso, shiftDay, weekBounds } from './dates';

describe('localDayKey', () => {
	it('places an instant on its local calendar day', () => {
		expect(localDayKey('2026-11-02T23:30:00Z', 'UTC')).toBe('2026-11-02');
		expect(localDayKey('2026-11-02T23:30:00Z', 'Europe/London')).toBe('2026-11-02');
		expect(localDayKey('2026-11-02T23:30:00Z', 'Asia/Tokyo')).toBe('2026-11-03');
	});
});

describe('groupByDay', () => {
	it('groups walks by day, ascending within and across days', () => {
		const groups = groupByDay(
			[
				{ walk_id: 'b', scheduled_at: '2026-11-03T09:00:00Z' },
				{ walk_id: 'c', scheduled_at: '2026-11-02T15:00:00Z' },
				{ walk_id: 'a', scheduled_at: '2026-11-02T09:00:00Z' }
			],
			'UTC'
		);
		expect(groups.map((g) => g.day)).toEqual(['2026-11-02', '2026-11-03']);
		expect(groups[0].items.map((w) => w.walk_id)).toEqual(['a', 'c']);
		expect(groups[1].items.map((w) => w.walk_id)).toEqual(['b']);
	});
	it('returns nothing for no walks', () => {
		expect(groupByDay([])).toEqual([]);
	});
});

describe('weekBounds', () => {
	it('spans Monday to the following Monday around the given day', () => {
		// 2026-11-05 is a Thursday
		expect(weekBounds('2026-11-05')).toEqual({ from: '2026-11-02T00:00:00.000Z', to: '2026-11-09T00:00:00.000Z' });
		// a Monday is its own week start; a Sunday belongs to the week before
		expect(weekBounds('2026-11-02').from).toBe('2026-11-02T00:00:00.000Z');
		expect(weekBounds('2026-11-08').from).toBe('2026-11-02T00:00:00.000Z');
	});
});

describe('shiftDay', () => {
	it('moves across month ends', () => {
		expect(shiftDay('2026-10-30', 7)).toBe('2026-11-06');
		expect(shiftDay('2026-11-02', -7)).toBe('2026-10-26');
	});
});

describe('datetime-local round trip', () => {
	it('converts an instant to an input value and back', () => {
		const iso = '2026-11-02T09:00:00.000Z';
		expect(localInputToIso(isoToLocalInput(iso))).toBe(iso);
	});
});

import { describe, expect, it } from 'vitest';
import { dayWindow, groupByDay, isoToZonedLocal, localDayKey, readTimeZone, shiftDay, weekBounds, zonedLocalToIso } from './dates';

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

describe('zonedLocalToIso', () => {
	it('reads the wall clock in the walker\'s zone, not the server\'s', () => {
		// BST: London is UTC+1 in July
		expect(zonedLocalToIso('2026-07-06T09:00', 'Europe/London')).toBe('2026-07-06T08:00:00.000Z');
		// GMT: London is UTC+0 in November
		expect(zonedLocalToIso('2026-11-02T09:00', 'Europe/London')).toBe('2026-11-02T09:00:00.000Z');
		expect(zonedLocalToIso('2026-11-03T08:30', 'Asia/Tokyo')).toBe('2026-11-02T23:30:00.000Z');
		expect(zonedLocalToIso('2026-11-02T09:00', 'UTC')).toBe('2026-11-02T09:00:00.000Z');
	});
	it('handles the hour after a DST change', () => {
		// Clocks went back at 02:00 BST on 2026-10-25; 01:30 is ambiguous, 03:00 is plainly GMT.
		expect(zonedLocalToIso('2026-10-25T03:00', 'Europe/London')).toBe('2026-10-25T03:00:00.000Z');
		// Clocks went forward at 01:00 GMT on 2026-03-29; 03:00 is plainly BST.
		expect(zonedLocalToIso('2026-03-29T03:00', 'Europe/London')).toBe('2026-03-29T02:00:00.000Z');
	});
	it('returns null for anything that is not a date-time', () => {
		expect(zonedLocalToIso('next-tuesday', 'Europe/London')).toBeNull();
		expect(zonedLocalToIso('2026-13-45T09:00', 'Europe/London')).toBeNull();
		expect(zonedLocalToIso('', 'UTC')).toBeNull();
		expect(zonedLocalToIso('2026-11-02T09:00', 'Mars/Olympus_Mons')).toBeNull();
	});
});

describe('isoToZonedLocal', () => {
	it('round-trips through the walker\'s zone', () => {
		for (const tz of ['Europe/London', 'Asia/Tokyo', 'America/Los_Angeles', 'UTC']) {
			const iso = '2026-07-06T08:00:00.000Z';
			expect(zonedLocalToIso(isoToZonedLocal(iso, tz), tz)).toBe(iso);
		}
		expect(isoToZonedLocal('2026-11-02T23:30:00.000Z', 'Asia/Tokyo')).toBe('2026-11-03T08:30');
	});
});

describe('weekBounds and dayWindow in a zone', () => {
	it('start at local midnight', () => {
		expect(weekBounds('2026-07-09', 'Europe/London')).toEqual({ from: '2026-07-05T23:00:00.000Z', to: '2026-07-12T23:00:00.000Z' });
		expect(dayWindow('2026-11-03', 7, 'Asia/Tokyo')).toEqual({ from: '2026-11-02T15:00:00.000Z', to: '2026-11-09T15:00:00.000Z' });
	});
});

describe('readTimeZone', () => {
	const cookies = (tz?: string) => ({ get: () => tz });
	it('accepts a known zone and falls back to UTC otherwise', () => {
		expect(readTimeZone(cookies('Europe/London'))).toBe('Europe/London');
		expect(readTimeZone(cookies('Mars/Olympus_Mons'))).toBe('UTC');
		expect(readTimeZone(cookies(undefined))).toBe('UTC');
	});
});

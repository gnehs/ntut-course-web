import { describe, expect, it } from 'vitest';
import { resolveEndDate, resolveStartDate } from './AddCalendarPage';
import type { CalendarEvent } from '../types/course';

const calendar = [
	event('2025-02-01T00:00:00.000Z', '2025-02-02T00:00:00.000Z', '113 學年度第 2 學期開始 '),
	event('2025-02-17T00:00:00.000Z', '2025-02-18T00:00:00.000Z', '開學正式上課、註冊截止日'),
	event('2025-06-16T00:00:00.000Z', '2025-06-22T00:00:00.000Z', '期末考試'),
	event('2025-06-23T00:00:00.000Z', '2025-06-24T00:00:00.000Z', '暑假開始、暑宿開始'),
	event('2025-08-01T00:00:00.000Z', '2025-08-02T00:00:00.000Z', '114 學年度第 1 學期開始'),
	event('2025-09-08T00:00:00.000Z', '2025-09-09T00:00:00.000Z', '開學暨註冊截止日、開學典禮'),
	event('2026-01-05T00:00:00.000Z', '2026-01-11T00:00:00.000Z', '期末考試'),
] satisfies CalendarEvent[];

describe('AddCalendarPage date defaults', () => {
	it('uses the first class day for semester start', () => {
		expect(resolveStartDate(calendar, '113', '2')).toBe('2025-02-17');
		expect(resolveStartDate(calendar, '114', '1')).toBe('2025-09-08');
	});

	it('uses the day before final exams as the last class day', () => {
		expect(resolveEndDate(calendar, '113', '2')).toBe('2025-06-15');
		expect(resolveEndDate(calendar, '114', '1')).toBe('2026-01-04');
	});

	it('falls back to valid semester dates when calendar events are missing', () => {
		expect(resolveStartDate([], '113', '2')).toBe('2025-01-02');
		expect(resolveEndDate([], '113', '2')).toBe('2025-06-30');
	});
});

function event(start: string, end: string, summary: string): CalendarEvent {
	return {
		type: 'VEVENT',
		start,
		end,
		summary,
	};
}

import { describe, expect, it } from 'vitest';
import { buildTimetableCourseItems } from './CourseList';
import type { Course } from '../types/course';

function course(id: string, slots: string[]): Course {
	return {
		id,
		code: id,
		courseType: '',
		name: { zh: `課程 ${id}` },
		credit: '3',
		hours: '3',
		description: { zh: '', en: '' },
		notes: '',
		stage: '',
		time: { mon: slots },
		teacher: [{ name: `教師 ${id}` }],
		class: [],
		classroom: [],
		people: '',
		peopleWithdraw: '',
		ta: [],
		language: '',
		courseDescriptionLink: '',
		syllabusLinks: [],
	};
}

describe('buildTimetableCourseItems', () => {
	it('keeps multiple courses in the same time block visible in separate lanes', () => {
		const items = buildTimetableCourseItems([
			course('1001', ['1', '2']),
			course('1002', ['1', '2']),
			course('1003', ['1', '2']),
		]);

		expect(items).toHaveLength(3);
		expect(items.map((item) => item.id)).toEqual(['1001', '1002', '1003']);
		expect(items.map((item) => item.isConflict)).toEqual([true, true, true]);
		expect(items.map((item) => item.laneCount)).toEqual([3, 3, 3]);
		expect(items.map((item) => item.laneIndex)).toEqual([0, 1, 2]);
	});

	it('assigns lanes to partially overlapping courses without merging them', () => {
		const items = buildTimetableCourseItems([
			course('2001', ['1', '2']),
			course('2002', ['2', '3']),
			course('2003', ['3', '4']),
		]);

		expect(items).toHaveLength(3);
		expect(items.map((item) => item.id)).toEqual(['2001', '2002', '2003']);
		expect(items.map((item) => item.isConflict)).toEqual([true, true, true]);
		expect(items.map((item) => item.laneCount)).toEqual([2, 2, 2]);
		expect(items.map((item) => item.laneIndex)).toEqual([0, 1, 0]);
	});
});

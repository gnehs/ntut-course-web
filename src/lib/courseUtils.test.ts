import { describe, expect, it } from 'vitest';
import {
	buildCourseCalendar,
	filterPlaceholderCourses,
	findSimilarCourses,
	formatCredit,
	isZeroCreditValue,
	parseCourseTime,
	parseYearSemVal,
	searchCourseList,
	trimEllip,
} from './courseUtils';
import type { Course } from '../types/course';

describe('courseUtils', () => {
	it('formats year and semester labels', () => {
		expect(parseYearSemVal('112-1')).toBe('112 年上學期');
		expect(parseYearSemVal('112-2')).toBe('112 年下學期');
	});

	it('trims long labels with ellipsis', () => {
		expect(trimEllip('北科課程好朋友', 4)).toBe('北科課程...');
	});

	it('parses course time by weekday', () => {
		expect(
			parseCourseTime({ mon: ['1', '2'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }),
		).toEqual([{ title: '週一', content: '1~2' }]);
	});

	it('searches course ids, names and teachers', () => {
		const courses = [
			{
				id: '123456',
				name: { zh: '微積分' },
				teacher: [{ name: '王老師' }],
				class: [],
				classroom: [],
				notes: '',
			},
		];
		expect(searchCourseList(courses, '123').length).toBe(1);
		expect(searchCourseList(courses, '王老師').length).toBe(1);
		expect(searchCourseList(courses, '英文').length).toBe(0);
	});

	it('finds other sections with the same name and other courses by the same teacher', () => {
		const course = (id: string, name: string, teachers: string[], extra = {}) =>
			({
				id,
				courseType: '▲',
				name: { zh: name },
				teacher: teachers.map((teacher) => ({ name: teacher })),
				class: [],
				notes: '',
				...extra,
			}) as unknown as Course;
		const current = course('1', '微積分', ['王老師']);
		const courses = [
			current,
			course('2', '微積分', ['李老師'], { courseType: '★' }),
			course('3', '微積分', ['王老師']),
			course('4', '線性代數', ['王老師']),
			course('5', '物理', ['李老師']),
			course('6', '線性代數', ['朴維鎮', '王老師']),
			course('placeholder-7', '微積分', ['李老師']),
		];

		const { sameName, sameTeacher } = findSimilarCourses(current, courses);

		expect(sameName.map((item) => item.id)).toEqual(['2', '3']);
		expect(sameTeacher.map((item) => item.id)).toEqual(['4']);
	});

	it('matches sports courses by sport rather than the shared course name', () => {
		const sports = (id: string, notes: string) =>
			({
				id,
				name: { zh: '體育' },
				teacher: [{ name: `${id}老師` }],
				class: [{ name: '體育專項' }],
				notes,
			}) as unknown as Course;
		const current = sports('1', '羽球');
		const { sameName } = findSimilarCourses(current, [current, sports('2', '羽球'), sports('3', '籃球')]);

		expect(sameName.map((item) => item.id)).toEqual(['2']);
	});

	it('filters placeholder courses', () => {
		expect(filterPlaceholderCourses([{ id: 'placeholder-1' }, { id: '123' }])).toEqual([
			{ id: '123' },
		]);
	});

	it('detects zero-credit requirement values from API payloads', () => {
		expect(isZeroCreditValue(0)).toBe(true);
		expect(isZeroCreditValue('0')).toBe(true);
		expect(isZeroCreditValue(' 0.0 ')).toBe(true);
		expect(isZeroCreditValue('０')).toBe(true);
		expect(isZeroCreditValue('１')).toBe(false);
		expect(isZeroCreditValue('128')).toBe(false);
		expect(isZeroCreditValue('')).toBe(false);
	});

	it('formats integral credits without decimal points', () => {
		expect(formatCredit('3.0')).toBe('3');
		expect(formatCredit(2)).toBe('2');
		expect(formatCredit('１.０')).toBe('1');
		expect(formatCredit('1.5')).toBe('1.5');
		expect(formatCredit('無資料')).toBe('無資料');
	});

	it('builds weekly course calendar events with Taipei timezone', () => {
		const calendar = buildCourseCalendar({
			year: '112',
			sem: '1',
			startDate: '2023-09-04',
			untilDate: '2024-01-12',
			courses: [
				{
					id: '123456',
					name: '微積分',
					description: '課程說明',
					classroom: '共同科館',
					link: 'https://ntut-course.gnehs.net/course/112/1/123456',
					time: { mon: ['1', '2'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
				},
			],
		});
		expect(calendar).toContain('X-WR-CALNAME:112 學年度上學期課程');
		expect(calendar).toContain('DTSTART;TZID=Asia/Taipei:20230904T081000');
		expect(calendar).toContain('DTEND;TZID=Asia/Taipei:20230904T100000');
		expect(calendar).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=20240112T000000');
	});
});

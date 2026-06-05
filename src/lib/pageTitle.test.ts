import { describe, expect, it } from 'vitest';
import { coursePageTitle, pageTitleForPath, stylizeCourseId } from './pageTitle';
import type { Course } from '../types/course';

describe('pageTitle', () => {
	it('keeps the default site title for the home page', () => {
		expect(pageTitleForPath('/')).toBe('北科課程好朋友');
	});

	it('maps known static routes to page titles', () => {
		expect(pageTitleForPath('/advanced-search')).toBe('搜尋');
		expect(pageTitleForPath('/calendar')).toBe('行事曆');
	});

	it('formats course titles like the original site', () => {
		expect(stylizeCourseId('360744')).toBe('𝟯𝟲𝟬𝟳𝟰𝟰');
		expect(coursePageTitle(course({ id: '360744', name: { zh: '國文', en: 'Chinese' } }))).toBe(
			'𝟯𝟲𝟬𝟳𝟰𝟰 國文',
		);
	});
});

function course(override: Partial<Course>): Course {
	return {
		code: '',
		id: '',
		courseType: '',
		name: { zh: '' },
		credit: '',
		hours: '',
		description: { zh: '', en: '' },
		notes: '',
		stage: '',
		time: {},
		teacher: [],
		class: [],
		classroom: [],
		people: '',
		peopleWithdraw: '',
		ta: [],
		language: '',
		courseDescriptionLink: '',
		syllabusLinks: [],
		...override,
	};
}

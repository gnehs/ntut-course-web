import { describe, expect, it } from 'vitest';
import type { Course } from '../types/course';
import {
	courseAttributeKeys,
	filterCoursesByMetadata,
	getCourseAttributeOptions,
	getLanguageOptions,
	hasMeaningfulValue,
	normalizeLanguage,
	parseMetadataFilterState,
	serializeMetadataFilterState,
} from './courseFilters';
import type { CourseAttribute, MetadataFilterState } from './courseFilters';

function course(overrides: Partial<Course> = {}) {
	return {
		id: '1',
		language: '',
		teacher: [],
		class: [],
		classroom: [],
		ta: [],
		time: {},
		name: { zh: '' },
		...overrides,
	} as Course;
}

describe('course metadata filters', () => {
	it('normalizes the English values used by Chinese and English course tables', () => {
		expect(normalizeLanguage('英文')).toBe('English');
		expect(normalizeLanguage('英語')).toBe('English');
		expect(normalizeLanguage('English')).toBe('English');
		expect(normalizeLanguage('英文授課')).toBe('English');
		expect(normalizeLanguage('中文')).toBe('中文');
		expect(normalizeLanguage('')).toBe('');
	});

	it('does not treat false, zero, or school empty markers as a usable flag', () => {
		for (const value of [false, 0, '0', '', '無', '● 無 (None)', '無（None）', '否', 'No', 'N/A']) {
			expect(hasMeaningfulValue(value)).toBe(false);
		}
		expect(hasMeaningfulValue('是')).toBe(true);
		expect(hasMeaningfulValue('隨班附讀')).toBe(true);
	});

	it('only offers metadata options that are present in the current course data', () => {
		const courses = [
			course({ id: '1', language: '英文', audit: '無', lab: '是' }),
			course({ id: '2', language: '中文', interdisciplinary: '跨域' }),
		];
		expect(getLanguageOptions(courses)).toEqual(['English', '中文']);
		expect(getCourseAttributeOptions(courses)).toEqual(['lab', 'interdisciplinary']);
		expect(courseAttributeKeys).toEqual(['audit', 'lab', 'interdisciplinary']);
	});

	it('filters language and course attributes with OR semantics', () => {
		const courses = [
			course({ id: '1', language: '英文', lab: '是' }),
			course({ id: '2', language: '英語', audit: '是' }),
			course({ id: '3', language: '中文', interdisciplinary: '是' }),
		];
		expect(
			filterCoursesByMetadata(courses, {
				language: 'English',
				attributes: ['lab'],
			}).map((item) => item.id),
		).toEqual(['1']);
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				attributes: ['audit', 'interdisciplinary'],
			}).map((item) => item.id),
		).toEqual(['2', '3']);
	});

	it('returns no matches for an unknown language or attribute when that field has data', () => {
		const courses = [
			course({ id: '1', language: '中文', audit: '是' }),
			course({ id: '2', language: '英文', lab: '是' }),
		];

		expect(
			filterCoursesByMetadata(courses, {
				language: '日文',
				attributes: [],
			}),
		).toEqual([]);
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				attributes: ['interdisciplinary'],
			}),
		).toEqual([]);
	});

	it('preserves filters when an old dataset has no language or attribute values', () => {
		const courses = [course({ id: '1', language: '', audit: '無', lab: '否' })];
		expect(
			filterCoursesByMetadata(courses, {
				language: 'English',
				attributes: ['audit'],
			}),
		).toEqual(courses);
	});

	it('round trips metadata filters through the URL query shape', () => {
		const state: MetadataFilterState = {
			language: 'English',
			attributes: ['lab', 'audit'] as CourseAttribute[],
		};
		const encoded = serializeMetadataFilterState(state);
		const decoded = parseMetadataFilterState(encoded);
		expect(decoded).toEqual({
			language: 'English',
			attributes: ['lab', 'audit'],
		});
	});
});

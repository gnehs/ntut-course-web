import { describe, expect, it } from 'vitest';
import type { Course, SyllabusIndex } from '../types/course';
import {
	AI_ANY_FILTER,
	courseAttributeKeys,
	filterCoursesByMetadata,
	getCourseAttributeOptions,
	getLanguageOptions,
	getSyllabusFilterOptions,
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

	it('derives AI options and valid SDG values from one syllabus index', () => {
		const index: SyllabusIndex = {
			'1': { ai: ['生成式 AI'], sdgs: [4, 17, 0, 18], resources: [], hasSyllabus: true },
			'2': { ai: [], sdgs: [4], resources: [], hasSyllabus: true },
		};
		expect(getSyllabusFilterOptions(index)).toEqual({ ai: ['生成式 AI'], sdgs: [4, 17] });
	});

	it('filters language, course attributes, AI, and SDGs with OR semantics', () => {
		const courses = [
			course({ id: '1', language: '英文', lab: '是' }),
			course({ id: '2', language: '英語', audit: '是' }),
			course({ id: '3', language: '中文', interdisciplinary: '是' }),
		];
		const syllabusIndex: SyllabusIndex = {
			'1': { ai: ['生成式 AI'], sdgs: [4], resources: [], hasSyllabus: true },
			'2': { ai: ['AI 輔助評量'], sdgs: [17], resources: [], hasSyllabus: true },
			'3': { ai: [], sdgs: [10], resources: [], hasSyllabus: true },
		};
		expect(
			filterCoursesByMetadata(courses, {
				language: 'English',
				ai: ['生成式 AI'],
				sdgs: [4],
				attributes: ['lab'],
				syllabusIndex,
			}).map((item) => item.id),
		).toEqual(['1']);
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				ai: [AI_ANY_FILTER],
				sdgs: [17, 10],
				attributes: ['audit', 'interdisciplinary'],
				syllabusIndex,
			}).map((item) => item.id),
		).toEqual(['2']);
	});

	it('ignores index-backed filters when the optional index is unavailable', () => {
		const courses = [course({ id: '1', language: '英文' }), course({ id: '2', language: '中文' })];
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				ai: [AI_ANY_FILTER],
				sdgs: [4],
				attributes: [],
				syllabusIndex: null,
			}),
		).toEqual(courses);
	});

	it('treats an existing empty index as a real zero-match source', () => {
		const courses = [course({ id: '1' }), course({ id: '2' })];
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				ai: [AI_ANY_FILTER],
				sdgs: [],
				attributes: [],
				syllabusIndex: {},
			}),
		).toEqual([]);
	});

	it('returns no matches for unknown AI and SDG selections when the index exists', () => {
		const courses = [course({ id: '1' })];
		const syllabusIndex: SyllabusIndex = {
			'1': { ai: ['生成式 AI'], sdgs: [4], resources: [], hasSyllabus: true },
		};

		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				ai: ['未收錄的教學方式'],
				sdgs: [],
				attributes: [],
				syllabusIndex,
			}),
		).toEqual([]);
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				ai: [],
				sdgs: [17],
				attributes: [],
				syllabusIndex,
			}),
		).toEqual([]);
	});

	it('returns no matches for an unknown language or attribute when that field has data', () => {
		const courses = [
			course({ id: '1', language: '中文', audit: '是' }),
			course({ id: '2', language: '英文', lab: '是' }),
		];

		expect(
			filterCoursesByMetadata(courses, {
				language: '日文',
				ai: [],
				sdgs: [],
				attributes: [],
				syllabusIndex: null,
			}),
		).toEqual([]);
		expect(
			filterCoursesByMetadata(courses, {
				language: '',
				ai: [],
				sdgs: [],
				attributes: ['interdisciplinary'],
				syllabusIndex: null,
			}),
		).toEqual([]);
	});

	it('preserves filters when an old dataset has no language or attribute values', () => {
		const courses = [course({ id: '1', language: '', audit: '無', lab: '否' })];
		expect(
			filterCoursesByMetadata(courses, {
				language: 'English',
				ai: [],
				sdgs: [],
				attributes: ['audit'],
				syllabusIndex: null,
			}),
		).toEqual(courses);
	});

	it('round trips metadata filters through the URL query shape', () => {
		const state: MetadataFilterState = {
			language: 'English',
			ai: [AI_ANY_FILTER],
			sdgs: [17, 4],
			attributes: ['lab', 'audit'] as CourseAttribute[],
		};
		const encoded = serializeMetadataFilterState(state);
		const decoded = parseMetadataFilterState(encoded);
		expect(decoded).toEqual({
			language: 'English',
			ai: [AI_ANY_FILTER],
			sdgs: [4, 17],
			attributes: ['lab', 'audit'],
		});
	});
});

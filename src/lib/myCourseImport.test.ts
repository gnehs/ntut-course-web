import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMyCourseBackup,
	importMyCourseData,
	mergeMyCourseBackup,
	parseMyCourseBackup,
	parseMyCourseImport,
	summarizeMyCourseBackup,
} from './myCourseImport';

const dataKey = 'my-couse-data-115-1';
const classKey = 'my-couse-class-115-1';

function payload(overrides: Record<string, unknown> = {}) {
	return JSON.stringify({
		key: dataKey,
		data: JSON.stringify(['COURSE-001', 'COURSE-002']),
		classKey,
		classData: 'CLASS-001',
		...overrides,
	});
}

describe('my course import', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('accepts the existing export format, including empty nullable values', () => {
		const imported = parseMyCourseImport(payload({ data: null, classData: null }));

		expect(imported.courseIds).toEqual([]);
		expect(imported.data).toBe('[]');
		expect(imported.classData).toBeNull();

		importMyCourseData(payload({ data: null, classData: null }));
		expect(localStorage.getItem(dataKey)).toBe('[]');
		expect(localStorage.getItem(classKey)).toBeNull();
	});

	it.each([
		['missing a required field', { classData: undefined }],
		['using an unrelated storage key', { key: 'user-preferences' }],
		['using mismatched semester keys', { classKey: 'my-couse-class-114-2' }],
		['containing malformed course JSON', { data: '{"course":"COURSE-001"}' }],
		['containing non-string course IDs', { data: JSON.stringify(['COURSE-001', 2]) }],
		['containing an invalid class value', { classData: 42 }],
	] as const)('rejects input %s before touching storage', (_description, overrides) => {
		localStorage.setItem(dataKey, JSON.stringify(['ORIGINAL']));
		localStorage.setItem(classKey, 'ORIGINAL-CLASS');
		const before = {
			data: localStorage.getItem(dataKey),
			classData: localStorage.getItem(classKey),
		};

		const input = Object.prototype.hasOwnProperty.call(overrides, 'classData')
			? (() => {
					const value = JSON.parse(payload());
					delete value.classData;
					return JSON.stringify(value);
				})()
			: payload(overrides);
		expect(() => importMyCourseData(input)).toThrow();
		expect(localStorage.getItem(dataKey)).toBe(before.data);
		expect(localStorage.getItem(classKey)).toBe(before.classData);
		expect(localStorage.getItem('user-preferences')).toBeNull();
	});

	it('restores both keys when the second storage write fails', () => {
		localStorage.setItem(dataKey, JSON.stringify(['ORIGINAL']));
		localStorage.setItem(classKey, 'ORIGINAL-CLASS');
		const originalSetItem = localStorage.setItem.bind(localStorage);
		let shouldFail = true;
		localStorage.setItem = ((key: string, value: string) => {
			if (key === classKey && shouldFail) {
				shouldFail = false;
				throw new Error('quota exceeded');
			}
			originalSetItem(key, value);
		}) as Storage['setItem'];

		try {
			expect(() => importMyCourseData(payload())).toThrow('quota exceeded');
		} finally {
			localStorage.setItem = originalSetItem;
		}

		expect(localStorage.getItem(dataKey)).toBe(JSON.stringify(['ORIGINAL']));
		expect(localStorage.getItem(classKey)).toBe('ORIGINAL-CLASS');
	});

	it('exports every saved semester, department, class, and micro-program without unrelated keys', () => {
		localStorage.setItem('my-couse-data-115-1', JSON.stringify(['COURSE-001']));
		localStorage.setItem(
			'my-couse-data-114-2-graduate',
			JSON.stringify(['COURSE-002', 'COURSE-003']),
		);
		localStorage.setItem('my-couse-class-115-1', '四技電機四');
		localStorage.setItem('my-couse-mprogram-114-2', '智慧聯網微學程');
		localStorage.setItem('data-year', '115');
		localStorage.setItem('user-preferences', '{"theme":"dark"}');

		const backup = createMyCourseBackup();

		expect(backup.courses).toEqual([
			{ key: 'my-couse-data-114-2-graduate', courseIds: ['COURSE-002', 'COURSE-003'] },
			{ key: 'my-couse-data-115-1', courseIds: ['COURSE-001'] },
		]);
		expect(backup.classes).toEqual([{ key: 'my-couse-class-115-1', classData: '四技電機四' }]);
		expect(backup.mprograms).toEqual([
			{ key: 'my-couse-mprogram-114-2', programName: '智慧聯網微學程' },
		]);
		expect(JSON.stringify(backup)).not.toContain('user-preferences');
		expect(JSON.stringify(backup)).not.toContain('data-year');

		const parsed = parseMyCourseBackup(JSON.stringify(backup));
		expect(parsed.semesterCount).toBe(2);
		expect(parsed.courseCount).toBe(3);
		expect(summarizeMyCourseBackup(parsed)).toEqual([
			{ year: '115', sem: '1', courseCount: 1, classCount: 1, mprogramCount: 0 },
			{ year: '114', sem: '2', courseCount: 2, classCount: 0, mprogramCount: 1 },
		]);
	});

	it('previews and accepts the legacy one-semester prompt payload', () => {
		const parsed = parseMyCourseBackup(payload());

		expect(parsed.legacy).toBe(true);
		expect(parsed.semesterCount).toBe(1);
		expect(parsed.courseCount).toBe(2);
		expect(parsed.payload.courses[0]).toEqual({
			key: dataKey,
			courseIds: ['COURSE-001', 'COURSE-002'],
		});
	});

	it('merges courses while preserving existing class and micro-program selections', () => {
		localStorage.setItem(dataKey, JSON.stringify(['COURSE-001', 'EXISTING']));
		localStorage.setItem(classKey, 'CURRENT-CLASS');
		localStorage.setItem('my-couse-mprogram-115-1', 'CURRENT-PROGRAM');
		const backup = parseMyCourseBackup(
			JSON.stringify({
				format: 'ntut-course-my-course-backup',
				version: 2,
				exportedAt: '2026-09-14T00:00:00.000Z',
				courses: [
					{ key: dataKey, courseIds: ['COURSE-001', 'IMPORTED'] },
					{ key: 'my-couse-data-114-2', courseIds: ['OTHER-TERM'] },
				],
				classes: [{ key: classKey, classData: 'IMPORTED-CLASS' }],
				mprograms: [{ key: 'my-couse-mprogram-115-1', programName: 'IMPORTED-PROGRAM' }],
			}),
		);

		const result = mergeMyCourseBackup(backup);

		expect(result.addedCourseCount).toBe(2);
		expect(result.classConflictCount).toBe(1);
		expect(result.mprogramConflictCount).toBe(1);
		expect(JSON.parse(localStorage.getItem(dataKey) || '[]')).toEqual([
			'COURSE-001',
			'EXISTING',
			'IMPORTED',
		]);
		expect(JSON.parse(localStorage.getItem('my-couse-data-114-2') || '[]')).toEqual(['OTHER-TERM']);
		expect(localStorage.getItem(classKey)).toBe('CURRENT-CLASS');
		expect(localStorage.getItem('my-couse-mprogram-115-1')).toBe('CURRENT-PROGRAM');
	});

	it('rejects duplicate keys before writing anything', () => {
		localStorage.setItem(dataKey, JSON.stringify(['ORIGINAL']));
		const raw = JSON.stringify({
			format: 'ntut-course-my-course-backup',
			version: 2,
			exportedAt: '2026-09-14T00:00:00.000Z',
			courses: [
				{ key: dataKey, courseIds: ['ONE'] },
				{ key: dataKey, courseIds: ['TWO'] },
			],
			classes: [],
			mprograms: [],
		});

		expect(() => parseMyCourseBackup(raw)).toThrow('重複');
		expect(localStorage.getItem(dataKey)).toBe(JSON.stringify(['ORIGINAL']));
	});

	it('rolls back all planned writes when a later write fails', () => {
		const imported = parseMyCourseBackup(
			JSON.stringify({
				format: 'ntut-course-my-course-backup',
				version: 2,
				exportedAt: '2026-09-14T00:00:00.000Z',
				courses: [
					{ key: dataKey, courseIds: ['IMPORTED'] },
					{ key: 'my-couse-data-114-2', courseIds: ['OTHER'] },
				],
				classes: [],
				mprograms: [],
			}),
		);
		const originalSetItem = localStorage.setItem.bind(localStorage);
		let writes = 0;
		localStorage.setItem = ((key: string, value: string) => {
			writes += 1;
			if (writes === 2) throw new Error('quota exceeded');
			originalSetItem(key, value);
		}) as Storage['setItem'];

		try {
			expect(() => mergeMyCourseBackup(imported)).toThrow('quota exceeded');
		} finally {
			localStorage.setItem = originalSetItem;
		}

		expect(localStorage.getItem(dataKey)).toBeNull();
		expect(localStorage.getItem('my-couse-data-114-2')).toBeNull();
	});
});

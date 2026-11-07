import { describe, expect, it } from 'vitest';
import { normalizeDataset } from './legacyData';

const cases = [
	{
		name: 'syllabus',
		path: '115/1/course/360744.json',
		legacy: [
			{
				name: '測試教師',
				email: 'teacher@example.com',
				objective: '大綱',
				schedule: '進度',
				延伸教學與資源: '資源',
				課程對應SDGs指標: 'SDG4：優質教育',
				課程是否導入AI: '無',
				教學方式: '案例討論',
				測試布林欄位: false,
				測試數值欄位: 0,
				foreignLanguageTextbooks: false,
			},
		],
		current: [
			{
				teacher: '測試教師',
				email: 'teacher@example.com',
				outline: '大綱',
				schedule: '進度',
				resources: '資源',
				sdgs: 'SDG4：優質教育',
				aiUsage: '無',
				foreignLanguageTextbooks: false,
				extra: { 教學方式: '案例討論', 測試布林欄位: '否', 測試數值欄位: '0' },
			},
		],
	},
	{
		name: 'department',
		path: '/115/1/department.json',
		legacy: [
			{
				category: '電資學院',
				name: '資訊工程系',
				href: 'https://example.com/department',
				class: [{ id: 'A', name: '資工一', href: 'https://example.com/class' }],
			},
		],
		current: [
			{
				category: '電資學院',
				name: '資訊工程系',
				link: 'https://example.com/department',
				class: [{ id: 'A', name: '資工一', link: 'https://example.com/class' }],
			},
		],
	},
	{
		name: 'micro programs',
		path: '115/1/mprogram.json',
		legacy: [{ id: 'AV2', name: '面板微學程', href: 'SearchMProgram.jsp?code=AV2', course: ['1'] }],
		current: [
			{ id: 'AV2', name: '面板微學程', link: 'SearchMProgram.jsp?code=AV2', courses: ['1'] },
		],
	},
	{
		name: 'programs',
		path: '/115/1/programs.json',
		legacy: [{ id: '620', name: '教育學程', href: 'https://example.com/program', courses: ['1'] }],
		current: [{ id: '620', name: '教育學程', link: 'https://example.com/program', courses: ['1'] }],
	},
	{
		name: 'competencies',
		path: 'competencies.json',
		legacy: [
			{
				id: 'cs',
				name: '資工系',
				href: 'SearchCompetency.jsp?code=cs',
				abilities: [],
				courses: [],
			},
		],
		current: [
			{
				id: 'cs',
				name: '資工系',
				link: 'SearchCompetency.jsp?code=cs',
				abilities: [],
				courses: [],
			},
		],
	},
];

describe('normalizeDataset', () => {
	it.each(cases)('maps legacy $name rows to the new shape', ({ path, legacy, current }) => {
		expect(normalizeDataset(path, legacy)).toEqual(current);
	});

	it.each(cases)('leaves new $name rows as they are', ({ path, current }) => {
		const expected = current.map((row) => ({ extra: {}, ...row }));
		expect(normalizeDataset(path, current)).toEqual(path.includes('/course/') ? expected : current);
	});

	it.each(cases)('is idempotent for $name', ({ path, legacy }) => {
		const once = normalizeDataset(path, legacy);
		expect(normalizeDataset(path, once)).toEqual(once);
	});

	it('keeps extra entries a new-format syllabus already carries', () => {
		expect(
			normalizeDataset('115/1/course/1.json', [
				{ teacher: 'A', extra: { 備註欄: 'x' }, 其他: 'y' },
			]),
		).toEqual([{ teacher: 'A', extra: { 其他: 'y', 備註欄: 'x' } }]);
	});

	it('passes other datasets and non-array bodies through', () => {
		const calendar = [{ name: 'x', href: 'y' }];
		expect(normalizeDataset('calendar.json', calendar)).toBe(calendar);
		expect(normalizeDataset('115/1/department.json', { error: true })).toEqual({ error: true });
	});
});

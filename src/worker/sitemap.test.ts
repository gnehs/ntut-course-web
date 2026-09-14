import { describe, expect, it } from 'vitest';
import { generateSitemapXml, parseSitemapRoute, renderSitemapIndex, renderUrlSet } from './sitemap';
import type { Course, DepartmentGroup, WithdrawalResponse, YearSemData } from '../types/course';

const config = { origin: 'https://ntut-course.gnehs.net' };

describe('sitemap routes', () => {
	it('parses the index, static, period, and teacher routes', () => {
		expect(parseSitemapRoute(new URL('https://example.com/sitemap.xml'))).toEqual({
			type: 'index',
		});
		expect(parseSitemapRoute(new URL('https://example.com/sitemap-static.xml'))).toEqual({
			type: 'static',
		});
		expect(parseSitemapRoute(new URL('https://example.com/sitemap-115-1.xml'))).toEqual({
			type: 'period',
			year: '115',
			sem: '1',
		});
		expect(parseSitemapRoute(new URL('https://example.com/sitemap-teachers.xml'))).toEqual({
			type: 'teachers',
		});
		expect(parseSitemapRoute(new URL('https://example.com/sitemap/115/1.txt'))).toBeNull();
	});
});

describe('sitemap XML', () => {
	it('renders escaped, deduplicated URL entries', () => {
		const xml = renderUrlSet(['https://example.com/a?x=1&y=2', 'https://example.com/a?x=1&y=2']);

		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('https://example.com/a?x=1&amp;y=2');
		expect(xml.match(/<url>/g)).toHaveLength(1);
	});

	it('renders the sitemap index', () => {
		const xml = renderSitemapIndex([
			'https://ntut-course.gnehs.net/sitemap-static.xml',
			'https://ntut-course.gnehs.net/sitemap-115-1.xml',
		]);

		expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml.match(/<sitemap>/g)).toHaveLength(2);
	});

	it('creates one index for every available period plus static and teacher maps', async () => {
		const fetchJson = async <T>(path: string): Promise<T> => {
			const data: YearSemData = { '114': [1, 2], '115': [1] };
			if (path === '/main.json') return data as T;
			throw new Error(`Unexpected path: ${path}`);
		};
		const xml = await generateSitemapXml({ type: 'index' }, config, fetchJson);

		expect(xml.match(/<sitemap>/g)).toHaveLength(5);
		expect(xml).toContain('/sitemap-114-1.xml');
		expect(xml).toContain('/sitemap-115-1.xml');
		expect(xml).toContain('/sitemap-static.xml');
		expect(xml).toContain('/sitemap-teachers.xml');
	});

	it('creates a period sitemap from courses and classes', async () => {
		const courses = [
			{ id: '123456', class: [{ id: 'A', name: '四技資工一' }] },
			{ id: '123456' },
			{ id: '654321' },
		] as Course[];
		const departments = [
			{
				category: '電資學院',
				name: '資訊工程系',
				href: '',
				class: [{ id: 'A', name: '四技資工一' }],
			},
		] as DepartmentGroup[];
		const fetchJson = async <T>(path: string): Promise<T> => {
			if (path === '/115/1/main.json') return courses as T;
			if (
				path === '/115/1/進修部.json' ||
				path === '/115/1/研究所(日間部、進修部、週末碩士班).json'
			)
				return [] as T;
			if (path === '/115/1/department.json') return departments as T;
			throw new Error(`Unexpected path: ${path}`);
		};
		const xml = await generateSitemapXml(
			{ type: 'period', year: '115', sem: '1' },
			config,
			fetchJson,
		);

		expect(xml).toContain('/course/115/1/123456');
		expect(xml).toContain('/course/115/1/654321');
		expect(xml).toContain('/class/115/1/%E5%9B%9B%E6%8A%80%E8%B3%87%E5%B7%A5%E4%B8%80?d=main');
		expect(xml.match(/<url>/g)).toHaveLength(3);
	});

	it('includes every department, deduplicates courses, and links only populated classes with their department', async () => {
		const graduate = '研究所(日間部、進修部、週末碩士班)';
		const data = {
			'/115/1/main.json': [{ id: '100001', class: [{ id: 'A', name: '共同班' }] }],
			'/115/1/進修部.json': [
				{ id: '100001', class: [] },
				{
					id: '200001',
					class: [
						{ id: 'B', name: '進修班' },
						{ id: 'A', name: '共同班' },
					],
				},
			],
			[`/115/1/${graduate}.json`]: [{ id: '300001', class: [{ id: 'C', name: '研究班' }] }],
			'/115/1/department.json': [
				{
					class: [
						{ id: 'A', name: '共同班' },
						{ id: 'B', name: '進修班' },
						{ id: 'C', name: '研究班' },
						{ id: 'D', name: '未開課班' },
					],
				},
			],
		};
		const xml = await generateSitemapXml(
			{ type: 'period', year: '115', sem: '1' },
			config,
			async <T>(path: string) => {
				if (!(path in data)) throw new Error(`Unexpected path: ${path}`);
				return data[path] as T;
			},
		);
		const document = new DOMParser().parseFromString(xml, 'application/xml');
		expect(document.querySelector('parsererror')).toBeNull();
		const urls = [...document.querySelectorAll('loc')].map((loc) => new URL(loc.textContent!));
		const courses = urls.filter((url) => url.pathname.startsWith('/course/'));
		expect(courses.map((url) => url.pathname)).toEqual([
			'/course/115/1/100001',
			'/course/115/1/200001',
			'/course/115/1/300001',
		]);
		expect(courses.map((url) => url.searchParams.get('d'))).toEqual([null, '進修部', graduate]);
		const classes = urls.filter((url) => url.pathname.startsWith('/class/'));
		expect(
			classes.map((url) => [
				decodeURIComponent(url.pathname.split('/').at(-1)!),
				url.searchParams.get('d'),
			]),
		).toEqual([
			['共同班', 'main'],
			['共同班', '進修部'],
			['進修班', '進修部'],
			['研究班', graduate],
		]);
	});

	it('keeps every indexed sitemap at the root and routable', async () => {
		const xml = await generateSitemapXml(
			{ type: 'index' },
			config,
			async <T>() => ({ '99': [1, 2], '115': [1] }) as T,
		);
		const document = new DOMParser().parseFromString(xml, 'application/xml');
		for (const loc of document.querySelectorAll('loc')) {
			const url = new URL(loc.textContent!);
			expect(new URL('.', url).pathname).toBe('/');
			expect(parseSitemapRoute(url)).not.toBeNull();
		}
	});

	it('excludes requested takedowns from teacher and course sitemaps', async () => {
		const hiddenTeacher = '朴維鎮';
		const fetchJson = async <T>(path: string): Promise<T> => {
			if (path === '/analytics/withdrawal.json') {
				return { data: [{ name: hiddenTeacher }, { name: '測試教師' }] } as T;
			}
			if (path.endsWith('/main.json')) {
				return [
					{ id: '100001', teacher: [{ name: hiddenTeacher }] },
					{ id: '100002', teacher: [{ name: '測試教師' }] },
				] as T;
			}
			return [] as T;
		};
		const teacherXml = await generateSitemapXml({ type: 'teachers' }, config, fetchJson);
		expect(teacherXml).not.toContain(encodeURIComponent(hiddenTeacher));
		expect(teacherXml).toContain(encodeURIComponent('測試教師'));
		const courseXml = await generateSitemapXml(
			{ type: 'period', year: '115', sem: '1' },
			config,
			fetchJson,
		);
		expect(courseXml).not.toContain('/course/115/1/100001');
		expect(courseXml).toContain('/course/115/1/100002');
	});

	it('creates teacher and static sitemaps', async () => {
		const withdrawal: WithdrawalResponse = {
			data: [
				{ name: '王小明', course: [] },
				{ name: '王小明', course: [] },
			],
		};
		const fetchJson = async <T>(path: string): Promise<T> => {
			if (path === '/analytics/withdrawal.json') return withdrawal as T;
			throw new Error(`Unexpected path: ${path}`);
		};
		const teacherXml = await generateSitemapXml({ type: 'teachers' }, config, fetchJson);
		const staticXml = await generateSitemapXml({ type: 'static' }, config, fetchJson);

		expect(teacherXml.match(/<url>/g)).toHaveLength(1);
		expect(teacherXml).toContain('/teacher/%E7%8E%8B%E5%B0%8F%E6%98%8E');
		expect(staticXml).toContain('https://ntut-course.gnehs.net/');
		expect(staticXml).toContain('https://ntut-course.gnehs.net/about');
	});
});

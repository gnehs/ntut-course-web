import type { Course, DepartmentGroup, WithdrawalResponse, YearSemData } from '../types/course';
import { WORKER_SITEMAP_CACHE_CONTROL } from './cache';

const DEFAULT_API_BASE = 'https://gnehs.github.io/ntut-course-crawler-node';
const COURSE_DEPARTMENTS = ['main', '進修部', '研究所(日間部、進修部、週末碩士班)'];
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const PUBLIC_PATHS = [
	'/',
	'/about',
	'/advanced-search',
	'/calendar',
	'/changelog',
	'/class',
	'/competencies',
	'/doc',
	'/mprogram',
	'/privacy',
	'/program',
	'/standard',
	'/status',
	'/withdrawal',
];

export type SitemapRoute =
	| { type: 'index' }
	| { type: 'static' }
	| { type: 'period'; year: string; sem: string }
	| { type: 'teachers' };

export type SitemapConfig = {
	apiBase?: string;
	origin: string;
};

type FetchJson = <T>(path: string) => Promise<T>;
type WaitUntilContext = {
	waitUntil(promise: Promise<unknown>): void;
};
type CloudflareCacheStorage = CacheStorage & { default: Cache };

export function parseSitemapRoute(url: URL): SitemapRoute | null {
	if (url.pathname === '/sitemap.xml') return { type: 'index' };
	if (url.pathname === '/sitemap-static.xml') return { type: 'static' };
	if (url.pathname === '/sitemap-teachers.xml') return { type: 'teachers' };

	const period = /^\/sitemap-(\d{2,3})-(\d+)\.xml$/.exec(url.pathname);
	return period ? { type: 'period', year: period[1], sem: period[2] } : null;
}

export async function handleSitemapRequest(
	request: Request,
	config: SitemapConfig,
	ctx: WaitUntilContext,
): Promise<Response | null> {
	const route = parseSitemapRoute(new URL(request.url));
	if (!route) return null;

	const cacheKey = createCacheKey(request);
	const defaultCache = getDefaultCache();
	const cached = await defaultCache.match(cacheKey);
	if (cached) return request.method === 'HEAD' ? withoutBody(cached) : cached;

	try {
		const xml = await generateSitemapXml(route, config);
		const init: ResponseInit = {
			headers: {
				'Cache-Control': WORKER_SITEMAP_CACHE_CONTROL,
				'Content-Type': 'application/xml; charset=UTF-8',
			},
		};
		const cacheResponse = new Response(xml, init);
		ctx.waitUntil(defaultCache.put(cacheKey, cacheResponse.clone()).catch(() => undefined));
		return request.method === 'HEAD' ? new Response(null, init) : cacheResponse;
	} catch (error) {
		console.error('Failed to generate sitemap', error);
		return new Response('Sitemap temporarily unavailable', {
			status: 503,
			headers: {
				'Cache-Control': 'no-store',
				'Content-Type': 'text/plain; charset=UTF-8',
			},
		});
	}
}

export async function generateSitemapXml(
	route: SitemapRoute,
	config: SitemapConfig,
	fetchJson: FetchJson = createApiFetcher(config.apiBase),
): Promise<string> {
	if (route.type === 'index') {
		const yearSems = await fetchJson<YearSemData>('/main.json');
		const sitemapUrls = Object.entries(yearSems)
			.flatMap(([year, sems]) =>
				sems.map((sem) => absoluteUrl(config, `/sitemap-${year}-${sem}.xml`)),
			)
			.concat([
				absoluteUrl(config, '/sitemap-static.xml'),
				absoluteUrl(config, '/sitemap-teachers.xml'),
			]);
		return renderSitemapIndex(sitemapUrls);
	}

	if (route.type === 'static') {
		return renderUrlSet(PUBLIC_PATHS.map((path) => absoluteUrl(config, path)));
	}

	if (route.type === 'teachers') {
		const withdrawal = await fetchJson<WithdrawalResponse>('/analytics/withdrawal.json');
		const urls = (withdrawal.data || [])
			.filter((teacher) => Boolean(teacher.name))
			.map((teacher) => absoluteUrl(config, `/teacher/${encodeURIComponent(teacher.name)}`));
		return renderUrlSet(urls);
	}

	const [courseLists, departments] = await Promise.all([
		Promise.all(
			COURSE_DEPARTMENTS.map((department) =>
				fetchJson<Course[]>(`/${route.year}/${route.sem}/${department}.json`),
			),
		),
		fetchJson<DepartmentGroup[]>(`/${route.year}/${route.sem}/department.json`),
	]);
	const courseUrls = new Map<string, string>();
	const classUrls: string[] = [];
	const classes = departments.flatMap((group) => group.class || []);
	for (const [index, courses] of courseLists.entries()) {
		const department = COURSE_DEPARTMENTS[index];
		const classNames = new Set<string>();
		for (const course of courses) {
			if (course.id && !courseUrls.has(course.id)) {
				const url = new URL(
					`/course/${route.year}/${route.sem}/${encodeURIComponent(course.id)}`,
					config.origin,
				);
				if (department !== 'main') url.searchParams.set('d', department);
				courseUrls.set(course.id, url.toString());
			}
			for (const classData of course.class || []) {
				if (classData.name) classNames.add(classData.name);
			}
		}
		for (const classData of classes) {
			if (!classData.name || !classNames.has(classData.name)) {
				continue;
			}
			const url = new URL(
				`/class/${route.year}/${route.sem}/${encodeURIComponent(classData.name)}`,
				config.origin,
			);
			// Pin even main so a saved department cannot change the linked class contents.
			url.searchParams.set('d', department);
			classUrls.push(url.toString());
		}
	}
	return renderUrlSet([...courseUrls.values(), ...classUrls]);
}

export function renderSitemapIndex(urls: string[]) {
	const entries = unique(urls)
		.map((url) => `\t<sitemap>\n\t\t<loc>${escapeXml(url)}</loc>\n\t</sitemap>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="${SITEMAP_NAMESPACE}">\n${entries}\n</sitemapindex>\n`;
}

export function renderUrlSet(urls: string[]) {
	const entries = unique(urls)
		.map((url) => `\t<url>\n\t\t<loc>${escapeXml(url)}</loc>\n\t</url>`)
		.join('\n');
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${entries}\n</urlset>\n`;
}

function createCacheKey(request: Request) {
	const url = new URL(request.url);
	url.search = '';
	url.hash = '';
	return new Request(url, { method: 'GET' });
}

function getDefaultCache() {
	return (globalThis.caches as CloudflareCacheStorage).default;
}

function withoutBody(response: Response) {
	return new Response(null, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
}

function createApiFetcher(apiBase = DEFAULT_API_BASE): FetchJson {
	const base = apiBase.replace(/\/$/, '');
	return async function fetchJson<T>(path: string) {
		const response = await fetch(`${base}${path}`);
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		return response.json() as Promise<T>;
	};
}

function absoluteUrl(config: SitemapConfig, path: string) {
	return new URL(path, config.origin).toString();
}

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function unique<T>(items: T[]) {
	return [...new Set(items)];
}

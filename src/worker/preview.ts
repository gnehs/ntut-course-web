import type {
	Course,
	DepartmentClass,
	DepartmentGroup,
	WithdrawalResponse,
	WithdrawalStat,
} from '../types/course';

const DEFAULT_API_BASE = 'https://gnehs.github.io/ntut-course-crawler-node';
const COURSE_DIGITS = ['𝟬', '𝟭', '𝟮', '𝟯', '𝟰', '𝟱', '𝟲', '𝟳', '𝟴', '𝟵'];

export type PreviewConfig = {
	apiBase?: string;
	ogImageBase?: string;
	origin: string;
};

export type PreviewMeta = {
	title: string;
	description: string;
	url: string;
	image: string;
};

export type PreviewRoute =
	| { type: 'course'; year: string; sem: string; id: string; department: string }
	| { type: 'class'; year: string; sem: string; id: string; department: string }
	| { type: 'teacher'; id: string };

type FetchJson = <T>(path: string) => Promise<T>;

export function parsePreviewRoute(url: URL): PreviewRoute | null {
	const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
	if (parts[0] === 'course' && parts.length === 4) {
		return {
			type: 'course',
			year: parts[1],
			sem: parts[2],
			id: parts[3],
			department: url.searchParams.get('d') || 'main',
		};
	}
	if (parts[0] === 'class' && parts.length === 4) {
		return {
			type: 'class',
			year: parts[1],
			sem: parts[2],
			id: parts[3],
			department: url.searchParams.get('d') || 'main',
		};
	}
	if (parts[0] === 'teacher' && parts.length === 2) {
		return { type: 'teacher', id: parts[1] };
	}
	return null;
}

export async function resolvePreviewMeta(
	route: PreviewRoute,
	config: PreviewConfig,
	fetchJson: FetchJson = createApiFetcher(config.apiBase),
): Promise<PreviewMeta | null> {
	if (route.type === 'course') return resolveCoursePreview(route, config, fetchJson);
	if (route.type === 'class') return resolveClassPreview(route, config, fetchJson);
	return resolveTeacherPreview(route, config, fetchJson);
}

export function createCoursePreview(
	course: Course,
	route: Extract<PreviewRoute, { type: 'course' }>,
	config: PreviewConfig,
): PreviewMeta {
	const image = new URL('/api', previewImageBase(config));
	image.searchParams.set('year', route.year);
	image.searchParams.set('sem', route.sem);
	image.searchParams.set('id', route.id);
	if (route.department !== 'main') image.searchParams.set('d', route.department);
	return {
		title: `${formatCourseId(route.id)} ${course.name?.zh || route.id}`,
		description:
			course.description?.zh || `在北科好朋友上查看課程「${course.name?.zh || route.id}」的資訊`,
		image: image.toString(),
		url: canonicalUrl(config, `/course/${route.year}/${route.sem}/${encodeURIComponent(route.id)}`),
	};
}

export function createClassPreview(
	classData: DepartmentClass,
	department: DepartmentGroup | null,
	courses: Course[],
	route: Extract<PreviewRoute, { type: 'class' }>,
	config: PreviewConfig,
): PreviewMeta {
	const courseNames = unique(
		courses
			.filter((course) =>
				(course.class || []).some(
					(item) =>
						item.name === classData.name || item.id === classData.id || item.name === route.id,
				),
			)
			.map((course) => course.name?.zh)
			.filter((name): name is string => Boolean(name)),
	);
	const description = courseNames.length
		? `在北科好朋友上查看課程「${classData.name}」的資訊，包含${courseNames.slice(0, 3).join('、')}課程與博雅、必選修等相關資訊`
		: `在北科好朋友上查看課程「${classData.name}」的資訊，如必選修課程、博雅等相關課程資訊`;
	const image = new URL('/api/class', previewImageBase(config));
	image.searchParams.set('year', route.year);
	image.searchParams.set('sem', route.sem);
	image.searchParams.set('id', classData.id || route.id);
	return {
		title: classData.name,
		description,
		image: image.toString(),
		url: canonicalUrl(
			config,
			`/class/${route.year}/${route.sem}/${encodeURIComponent(classData.name || route.id)}`,
		),
	};
}

export function createTeacherPreview(
	teacher: WithdrawalStat,
	route: Extract<PreviewRoute, { type: 'teacher' }>,
	config: PreviewConfig,
): PreviewMeta {
	const courseNames = unique(
		(teacher.course || [])
			.map((course) => course.name?.zh)
			.filter((name): name is string => Boolean(name)),
	);
	const image = new URL('/api/teacher', previewImageBase(config));
	image.searchParams.set('name', route.id);
	return {
		title: teacher.name,
		description: `在北科好朋友上查看教師「${teacher.name}」的資訊，包含${courseNames.slice(0, 3).join('、')}等課程與選課人數等相關資訊`,
		image: image.toString(),
		url: canonicalUrl(config, `/teacher/${encodeURIComponent(route.id)}`),
	};
}

export function previewTags(meta: PreviewMeta) {
	return [
		{ key: 'description', name: 'description', content: meta.description },
		{ key: 'og:type', property: 'og:type', content: 'website' },
		{ key: 'og:locale', property: 'og:locale', content: 'zh_TW' },
		{ key: 'og:site_name', property: 'og:site_name', content: '北科課程好朋友' },
		{ key: 'og:title', property: 'og:title', content: meta.title },
		{ key: 'og:description', property: 'og:description', content: meta.description },
		{ key: 'og:url', property: 'og:url', content: meta.url },
		{ key: 'og:image', property: 'og:image', content: meta.image },
		{ key: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
		{ key: 'twitter:title', name: 'twitter:title', content: meta.title },
		{ key: 'twitter:description', name: 'twitter:description', content: meta.description },
		{ key: 'twitter:image', name: 'twitter:image', content: meta.image },
	];
}

async function resolveCoursePreview(
	route: Extract<PreviewRoute, { type: 'course' }>,
	config: PreviewConfig,
	fetchJson: FetchJson,
) {
	const courses = await fetchJson<Course[]>(`/${route.year}/${route.sem}/${route.department}.json`);
	const course = courses.find((item) => item.id === route.id);
	return course ? createCoursePreview(course, route, config) : null;
}

async function resolveClassPreview(
	route: Extract<PreviewRoute, { type: 'class' }>,
	config: PreviewConfig,
	fetchJson: FetchJson,
) {
	const [departments, courses] = await Promise.all([
		fetchJson<DepartmentGroup[]>(`/${route.year}/${route.sem}/department.json`),
		fetchJson<Course[]>(`/${route.year}/${route.sem}/${route.department}.json`),
	]);
	for (const department of departments) {
		const classData = (department.class || []).find(
			(item) => item.name === route.id || item.id === route.id,
		);
		if (classData) return createClassPreview(classData, department, courses, route, config);
	}
	return null;
}

async function resolveTeacherPreview(
	route: Extract<PreviewRoute, { type: 'teacher' }>,
	config: PreviewConfig,
	fetchJson: FetchJson,
) {
	const withdrawal = await fetchJson<WithdrawalResponse>('/analytics/withdrawal.json');
	const teacher = withdrawal.data?.find((item) => item.name === route.id);
	return teacher ? createTeacherPreview(teacher, route, config) : null;
}

function createApiFetcher(apiBase = DEFAULT_API_BASE): FetchJson {
	const base = apiBase.replace(/\/$/, '');
	return async function fetchJson<T>(path: string) {
		const response = await fetch(`${base}${path}`);
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		return response.json() as Promise<T>;
	};
}

function previewImageBase(config: PreviewConfig) {
	return config.ogImageBase || config.origin;
}

function canonicalUrl(config: PreviewConfig, path: string) {
	return new URL(path, config.origin).toString();
}

function formatCourseId(id: string) {
	return id
		.split('')
		.map((char) => COURSE_DIGITS[Number(char)] ?? char)
		.join('');
}

function unique<T>(items: T[]) {
	return [...new Set(items)];
}

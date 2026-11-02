import type { Course } from '../types/course';

export const ALL_LANGUAGE_FILTER = '__all__';

export const courseAttributeKeys = ['audit', 'lab', 'interdisciplinary'] as const;
export type CourseAttribute = (typeof courseAttributeKeys)[number];

export const courseAttributeLabels: Record<CourseAttribute, string> = {
	audit: '隨班附讀',
	lab: '實驗實習',
	interdisciplinary: '跨領域',
};

export type MetadataFilterState = {
	language: string;
	attributes: CourseAttribute[];
};

const emptyMarkers = new Set([
	'',
	'無',
	'無none',
	'無不適用',
	'無資料',
	'不適用',
	'不詳',
	'否',
	'否none',
	'none',
	'null',
	'no',
	'false',
	'0',
	'n/a',
	'na',
	'-',
	'—',
]);

function compactMarker(value: string) {
	return value
		.toLocaleLowerCase()
		.replace(/[●○◎★☆▲△*]/g, '')
		.replace(/[（）()【】\[\]「」]/g, '')
		.replace(/[／/]/g, '/')
		.replace(/\s+/g, '')
		.trim();
}

/** Returns false for the placeholders used by the course system for an empty flag. */
export function hasMeaningfulValue(value: unknown): boolean {
	if (typeof value === 'boolean') return value;
	if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
	const text = String(value ?? '').trim();
	if (!text) return false;
	return !emptyMarkers.has(compactMarker(text));
}

/**
 * Keep the original language value for display, while giving the English shortcut one
 * stable value across the Chinese and English course tables.
 */
export function normalizeLanguage(value: unknown): string {
	const text = String(value ?? '')
		.replace(/\s+/g, ' ')
		.trim();
	if (!hasMeaningfulValue(text)) return '';

	const compact = text.toLocaleLowerCase().replace(/[\s_-]+/g, '');
	if (
		['en', 'english', '英文', '英語', '英文授課', '英語授課', '全英文', '全英語'].includes(compact)
	)
		return 'English';

	return text;
}

export function languageLabel(value: string) {
	return normalizeLanguage(value) === 'English' ? '英文 / English' : value;
}

function uniqueStrings(values: unknown[]) {
	const result: string[] = [];
	const seen = new Set<string>();
	for (const value of values) {
		const text = String(value ?? '').trim();
		if (!hasMeaningfulValue(text) || seen.has(text)) continue;
		seen.add(text);
		result.push(text);
	}
	return result;
}

export function getLanguageOptions(courses: Course[]) {
	const values = new Map<string, string>();
	for (const course of courses) {
		const normalized = normalizeLanguage(course.language);
		if (normalized && !values.has(normalized)) values.set(normalized, normalized);
	}
	return [...values.values()].sort((a, b) => {
		if (a === 'English') return -1;
		if (b === 'English') return 1;
		return a.localeCompare(b, 'zh-Hant');
	});
}

export function getCourseAttributeOptions(courses: Course[]) {
	return courseAttributeKeys.filter((key) =>
		courses.some((course) => hasMeaningfulValue(course[key])),
	);
}

function stringList(value: unknown) {
	if (Array.isArray(value)) return uniqueStrings(value);
	if (typeof value === 'string') return uniqueStrings(value.split(','));
	return [];
}

export function parseMetadataFilterState(query: {
	language?: unknown;
	attrs?: unknown;
}): MetadataFilterState {
	return {
		language: normalizeLanguage(query.language),
		attributes: stringList(query.attrs).filter((value): value is CourseAttribute =>
			(courseAttributeKeys as readonly string[]).includes(value),
		),
	};
}

export function serializeMetadataFilterState(state: MetadataFilterState) {
	return {
		language: normalizeLanguage(state.language) || undefined,
		attrs: state.attributes.length ? state.attributes : undefined,
	};
}

function hasLanguageData(courses: Course[]) {
	return courses.some((course) => normalizeLanguage(course.language));
}

function hasCourseAttributeData(courses: Course[]) {
	return courseAttributeKeys.some((key) =>
		courses.some((course) => hasMeaningfulValue(course[key])),
	);
}

/**
 * Applies only metadata filters. Filters whose source is unavailable are ignored so
 * missing optional data can never make a shared URL empty.
 */
export function filterCoursesByMetadata(
	courses: Course[],
	{ language, attributes }: MetadataFilterState,
) {
	let result = courses;

	if (language && hasLanguageData(courses)) {
		result = result.filter((course) => normalizeLanguage(course.language) === language);
	}

	if (attributes.length && hasCourseAttributeData(courses)) {
		result = result.filter((course) => attributes.some((key) => hasMeaningfulValue(course[key])));
	}

	return result;
}

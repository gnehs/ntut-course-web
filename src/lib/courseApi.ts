import { API_BASE } from './courseUtils';
import { normalizeDataset } from './legacyData';
import { findGeneralProgramDocs, findMicroProgramDocs } from './programDocs';
import { getStore, setStore } from './storage';
import type { StandardDepartmentEntry } from './studentPrefix';
import type {
	CalendarEvent,
	Course,
	CompetencyDepartment,
	DepartmentGroup,
	Holiday,
	MicroProgram,
	MicroProgramDocs,
	Program,
	ProgramDocs,
	StandardYearData,
	SyllabusItem,
	WithdrawalRateMap,
	WithdrawalResponse,
	YearSemData,
} from '../types/course';

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	return response.json();
}

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Callers asking for the same dataset before it settles share one request. Pages and the
 * navbar search mount together, so each would otherwise download and compress its own copy.
 */
function shared<T>(key: string, load: () => Promise<T>): Promise<T> {
	const pending = pendingRequests.get(key);
	if (pending) return pending as Promise<T>;
	const request = load().finally(() => pendingRequests.delete(key));
	pendingRequests.set(key, request);
	return request;
}

/** Persisting is best effort: a full or blocked IndexedDB must not fail data that already arrived. */
function remember(key: string, data: unknown, expiration?: number) {
	const saved = expiration === undefined ? setStore(key, data) : setStore(key, data, expiration);
	void Promise.resolve(saved).catch(() => {});
}

function fetchCached<T>(key: string, path: string, expiration?: number): Promise<T> {
	return shared(key, async () => {
		const cached = await getStore(key);
		if (cached) return normalizeDataset<T>(path, cached);
		const data = normalizeDataset<T>(path, await fetchJson<unknown>(`${API_BASE}/${path}`));
		remember(key, data, expiration);
		return data;
	});
}

export function fetchYearData(): Promise<YearSemData> {
	const key = 'main_year';
	return shared(key, async () => {
		const cached = sessionStorage.getItem(key);
		if (cached) return JSON.parse(cached) as YearSemData;
		const data = await fetchJson<YearSemData>(`${API_BASE}/main.json`);
		sessionStorage.setItem(key, JSON.stringify(data));
		return data;
	});
}

export async function fetchCourse(
	year: string,
	sem: string,
	department = 'main',
): Promise<Course[]> {
	if (!year || !sem) return [];
	const key = `${year}/${sem}/${department}`;
	const courses = await fetchCached<Course[]>(`course_${year}_${sem}_${department}`, `${key}.json`);
	loadedCourses.set(key, courses);
	return courses;
}

// Lists this session already holds, so a view can render from them on its first frame.
const loadedCourses = new Map<string, Course[]>();

/** The course list if this session has already loaded it, without waiting on storage. */
export function loadedCourse(year: string, sem: string, department = 'main') {
	return loadedCourses.get(`${year}/${sem}/${department}`);
}

export async function fetchCourseDetail(
	year: string,
	sem: string,
	id: string,
): Promise<SyllabusItem[]> {
	if (!year || !sem) return [];
	return fetchCached(`course_detail_${year}_${sem}_${id}`, `${year}/${sem}/course/${id}.json`);
}

export async function fetchDepartment(year: string, sem: string): Promise<DepartmentGroup[]> {
	if (!year || !sem) return [];
	return fetchCached(`department_${year}_${sem}`, `${year}/${sem}/department.json`);
}

export function fetchWithdrawalRate(period = ''): Promise<WithdrawalRateMap> {
	return fetchCached(`withdrawalRate${period}`, `analytics/withdrawal-rate${period}.json`, 30);
}

export function fetchWithdrawal(period = ''): Promise<WithdrawalResponse> {
	const url = `${API_BASE}/analytics/withdrawal${period}.json`;
	return shared(url, () => fetchJson<WithdrawalResponse>(url));
}

export function fetchCalendar(): Promise<CalendarEvent[]> {
	const url = `${API_BASE}/calendar.json`;
	return shared(url, () => fetchJson<CalendarEvent[]>(url));
}

/** 人事行政總處「政府行政機關辦公日曆表」，經 ruyut/TaiwanCalendar 轉成可跨站讀取的 JSON。 */
const HOLIDAY_BASE = 'https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data';

type GovernmentCalendarDay = {
	date: string;
	week: string;
	isHoliday: boolean;
	description: string;
};

/**
 * Days off that fall where classes could meet: every weekday off, plus named holidays on
 * weekends. A plain Saturday is also marked off, yet evening and weekend classes still run.
 */
export function fetchHolidays(year: number): Promise<Holiday[]> {
	const url = `${HOLIDAY_BASE}/${year}.json`;
	return shared(url, async () =>
		(await fetchJson<GovernmentCalendarDay[]>(url))
			.filter((day) => day.isHoliday && (day.description || !['六', '日'].includes(day.week)))
			.map((day) => ({
				date: `${day.date.slice(0, 4)}-${day.date.slice(4, 6)}-${day.date.slice(6, 8)}`,
				name: day.description || '放假',
			})),
	);
}

export function fetchStandards(): Promise<string[]> {
	return fetchCached('standards', 'standards.json', 30);
}

export function fetchStandardYear(year: string): Promise<StandardYearData> {
	return fetchCached(`standard_${year}`, `${year}/standard.json`, 30);
}

/** Only the admission year is sent; student identifiers stay in the input. */
export async function fetchStandardDepartments(year: string): Promise<StandardDepartmentEntry[]> {
	if (!/^\d{2,3}$/.test(year)) throw new Error('無效的入學年度');
	const key = `standard_departments_${year}`;
	const valid = (data: unknown): data is StandardDepartmentEntry[] =>
		Array.isArray(data) &&
		data.length > 0 &&
		data.every(
			(entry) =>
				entry &&
				['system', 'department', 'division', 'matric'].every(
					(field) => typeof entry[field] === 'string' && entry[field].length > 0,
				),
		);
	return shared(key, async () => {
		const cached = await getStore(key);
		if (valid(cached)) return cached;
		const data = await fetchJson<unknown>(`${API_BASE}/${year}/standard-departments.json`);
		if (!valid(data)) throw new Error('系所索引格式不正確');
		remember(key, data, 1);
		return data;
	});
}

export async function fetchMicroPrograms(year: string, sem: string): Promise<MicroProgram[]> {
	if (!year || !sem) return [];
	return fetchCached(`mprogram_${year}_${sem}`, `${year}/${sem}/mprogram.json`, 30);
}

function fetchOptionalDataset<T>(path: string): Promise<T | null> {
	const key = `optional_${path}`;
	return shared(key, async () => {
		const cached = await getStore(key);
		if (cached) return normalizeDataset<T>(path, cached);
		const response = await fetch(`${API_BASE}/${path}`);
		if (response.status === 404) return null;
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		const data = normalizeDataset<T>(path, await response.json());
		remember(key, data);
		return data;
	});
}

export function fetchPrograms(year: string, sem: string): Promise<Program[] | null> {
	if (!year || !sem) return Promise.resolve(null);
	return fetchOptionalDataset(`${year}/${sem}/programs.json`);
}

export async function fetchMicroProgramDocs(id: string): Promise<MicroProgramDocs | null> {
	return findMicroProgramDocs(await fetchOptionalDataset('mprogram-docs.json'), id);
}

export async function fetchProgramDocs(id: string, name: string): Promise<ProgramDocs | null> {
	return findGeneralProgramDocs(await fetchOptionalDataset('program-docs.json'), id, name);
}

export function fetchCompetencies(): Promise<CompetencyDepartment[] | null> {
	return fetchOptionalDataset('competencies.json');
}

import { API_BASE } from './courseUtils';
import { getStore, setStore } from './storage';
import type { StandardDepartmentEntry } from './studentPrefix';
import type {
	CalendarEvent,
	Course,
	CompetencyDepartment,
	DepartmentGroup,
	MicroProgram,
	Program,
	StandardYearData,
	SyllabusItem,
	SyllabusIndex,
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
		if (cached) return cached as T;
		const data = await fetchJson<T>(`${API_BASE}/${path}`);
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
	return fetchCached(`course_${year}_${sem}_${department}`, `${year}/${sem}/${department}.json`);
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
		if (cached) return cached as T;
		const response = await fetch(`${API_BASE}/${path}`);
		if (response.status === 404) return null;
		if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
		const data = (await response.json()) as T;
		remember(key, data);
		return data;
	});
}

export function fetchPrograms(year: string, sem: string): Promise<Program[] | null> {
	if (!year || !sem) return Promise.resolve(null);
	return fetchOptionalDataset(`${year}/${sem}/programs.json`);
}

export function fetchCompetencies(): Promise<CompetencyDepartment[] | null> {
	return fetchOptionalDataset('competencies.json');
}

export function fetchSyllabusIndex(year: string, sem: string): Promise<SyllabusIndex | null> {
	if (!year || !sem) return Promise.resolve(null);
	return fetchOptionalDataset(`${year}/${sem}/syllabus-index.json`);
}

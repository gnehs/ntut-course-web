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

export async function fetchYearData(): Promise<YearSemData> {
	const key = 'main_year';
	const cached = sessionStorage.getItem(key);
	if (cached) return JSON.parse(cached) as YearSemData;
	const data = await fetchJson<YearSemData>(`${API_BASE}/main.json`);
	sessionStorage.setItem(key, JSON.stringify(data));
	return data;
}

export async function fetchCourse(
	year: string,
	sem: string,
	department = 'main',
): Promise<Course[]> {
	const dataKey = `course_${year}_${sem}_${department}`;
	const cached = await getStore(dataKey);
	if (cached) return cached as Course[];
	const data = await fetchJson<Course[]>(`${API_BASE}/${year}/${sem}/${department}.json`);
	await setStore(dataKey, data);
	return data;
}

export async function fetchCourseDetail(
	year: string,
	sem: string,
	id: string,
): Promise<SyllabusItem[]> {
	const key = `course_detail_${year}_${sem}_${id}`;
	const cached = await getStore(key);
	if (cached) return cached as SyllabusItem[];
	const data = await fetchJson<SyllabusItem[]>(`${API_BASE}/${year}/${sem}/course/${id}.json`);
	await setStore(key, data);
	return data;
}

export async function fetchDepartment(year: string, sem: string): Promise<DepartmentGroup[]> {
	const key = `department_${year}_${sem}`;
	const cached = await getStore(key);
	if (cached) return cached as DepartmentGroup[];
	const data = await fetchJson<DepartmentGroup[]>(`${API_BASE}/${year}/${sem}/department.json`);
	await setStore(key, data);
	return data;
}

export async function fetchWithdrawalRate(period = ''): Promise<WithdrawalRateMap> {
	const key = `withdrawalRate${period}`;
	const cached = await getStore(key);
	if (cached) return cached as WithdrawalRateMap;
	const data = await fetchJson<WithdrawalRateMap>(
		`${API_BASE}/analytics/withdrawal-rate${period}.json`,
	);
	await setStore(key, data, 30);
	return data;
}

export async function fetchWithdrawal(period = ''): Promise<WithdrawalResponse> {
	return fetchJson<WithdrawalResponse>(`${API_BASE}/analytics/withdrawal${period}.json`);
}

export async function fetchCalendar(): Promise<CalendarEvent[]> {
	return fetchJson<CalendarEvent[]>(`${API_BASE}/calendar.json`);
}

export async function fetchStandards(): Promise<string[]> {
	const cached = await getStore('standards');
	if (cached) return cached as string[];
	const data = await fetchJson<string[]>(`${API_BASE}/standards.json`);
	await setStore('standards', data, 30);
	return data;
}

export async function fetchStandardYear(year: string): Promise<StandardYearData> {
	const key = `standard_${year}`;
	const cached = await getStore(key);
	if (cached) return cached as StandardYearData;
	const data = await fetchJson<StandardYearData>(`${API_BASE}/${year}/standard.json`);
	await setStore(key, data, 30);
	return data;
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
	const cached = await getStore(key);
	if (valid(cached)) return cached;
	const data = await fetchJson<unknown>(`${API_BASE}/${year}/standard-departments.json`);
	if (!valid(data)) throw new Error('系所索引格式不正確');
	await setStore(key, data, 1);
	return data;
}

export async function fetchMicroPrograms(year: string, sem: string): Promise<MicroProgram[]> {
	const key = `mprogram_${year}_${sem}`;
	const cached = await getStore(key);
	if (cached) return cached as MicroProgram[];
	const data = await fetchJson<MicroProgram[]>(`${API_BASE}/${year}/${sem}/mprogram.json`);
	await setStore(key, data, 30);
	return data;
}

async function fetchOptionalDataset<T>(path: string): Promise<T | null> {
	const key = `optional_${path}`;
	const cached = await getStore(key);
	if (cached) return cached as T;
	const response = await fetch(`${API_BASE}/${path}`);
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
	const data = (await response.json()) as T;
	await setStore(key, data);
	return data;
}

export function fetchPrograms(year: string, sem: string): Promise<Program[] | null> {
	return fetchOptionalDataset(`${year}/${sem}/programs.json`);
}

export function fetchCompetencies(): Promise<CompetencyDepartment[] | null> {
	return fetchOptionalDataset('competencies.json');
}

export function fetchSyllabusIndex(year: string, sem: string): Promise<SyllabusIndex | null> {
	return fetchOptionalDataset(`${year}/${sem}/syllabus-index.json`);
}

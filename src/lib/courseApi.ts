import { API_BASE } from './courseUtils'
import { getStore, setStore } from './storage'
import type { CalendarEvent, Course, DepartmentGroup, MicroProgram, StandardYearData, WithdrawalRateMap, WithdrawalResponse, YearSemData } from '../types/course'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.json()
}

export async function fetchYearData(): Promise<YearSemData> {
  const key = 'main_year'
  const cached = sessionStorage.getItem(key)
  if (cached) return JSON.parse(cached) as YearSemData
  const data = await fetchJson<YearSemData>(`${API_BASE}/main.json`)
  sessionStorage.setItem(key, JSON.stringify(data))
  return data
}

export async function fetchCourse(year: string, sem: string, department = 'main'): Promise<Course[]> {
  const dataKey = `course_${year}_${sem}_${department}`
  const cached = await getStore(dataKey)
  if (cached) return cached as Course[]
  const data = await fetchJson<Course[]>(`${API_BASE}/${year}/${sem}/${department}.json`)
  await setStore(dataKey, data)
  return data
}

export async function fetchCourseDetail(year: string, sem: string, id: string): Promise<Course> {
  const key = `course_detail_${year}_${sem}_${id}`
  const cached = await getStore(key)
  if (cached) return cached as Course
  const data = await fetchJson<Course>(`${API_BASE}/${year}/${sem}/course/${id}.json`)
  await setStore(key, data)
  return data
}

export async function fetchDepartment(year: string, sem: string): Promise<DepartmentGroup[]> {
  const key = `department_${year}_${sem}`
  const cached = await getStore(key)
  if (cached) return cached as DepartmentGroup[]
  const data = await fetchJson<DepartmentGroup[]>(`${API_BASE}/${year}/${sem}/department.json`)
  await setStore(key, data)
  return data
}

export async function fetchWithdrawalRate(period = ''): Promise<WithdrawalRateMap> {
  const key = `withdrawalRate${period}`
  const cached = await getStore(key)
  if (cached) return cached as WithdrawalRateMap
  const data = await fetchJson<WithdrawalRateMap>(`${API_BASE}/analytics/withdrawal-rate${period}.json`)
  await setStore(key, data, 30)
  return data
}

export async function fetchWithdrawal(period = ''): Promise<WithdrawalResponse> {
  return fetchJson<WithdrawalResponse>(`${API_BASE}/analytics/withdrawal${period}.json`)
}

export async function fetchCalendar(): Promise<CalendarEvent[]> {
  return fetchJson<CalendarEvent[]>(`${API_BASE}/calendar.json`)
}

export async function fetchStandards(): Promise<string[]> {
  const cached = await getStore('standards')
  if (cached) return cached as string[]
  const data = await fetchJson<string[]>(`${API_BASE}/standards.json`)
  await setStore('standards', data, 30)
  return data
}

export async function fetchStandardYear(year: string): Promise<StandardYearData> {
  const key = `standard_${year}`
  const cached = await getStore(key)
  if (cached) return cached as StandardYearData
  const data = await fetchJson<StandardYearData>(`${API_BASE}/${year}/standard.json`)
  await setStore(key, data, 30)
  return data
}

export async function fetchMicroPrograms(year: string, sem: string): Promise<MicroProgram[]> {
  const key = `mprogram_${year}_${sem}`
  const cached = await getStore(key)
  if (cached) return cached as MicroProgram[]
  const data = await fetchJson<MicroProgram[]>(`${API_BASE}/${year}/${sem}/mprogram.json`)
  await setStore(key, data, 30)
  return data
}

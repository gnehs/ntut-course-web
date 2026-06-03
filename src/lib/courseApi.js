import { API_BASE } from './courseUtils.js'
import { getStore, setStore } from './storage.js'

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
  return response.json()
}

export async function fetchYearData() {
  const key = 'main_year'
  const cached = sessionStorage.getItem(key)
  if (cached) return JSON.parse(cached)
  const data = await fetchJson(`${API_BASE}/main.json`)
  sessionStorage.setItem(key, JSON.stringify(data))
  return data
}

export async function fetchCourse(year, sem, department = 'main') {
  const dataKey = `course_${year}_${sem}_${department}`
  const cached = await getStore(dataKey)
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/${year}/${sem}/${department}.json`)
  await setStore(dataKey, data)
  return data
}

export async function fetchCourseDetail(year, sem, id) {
  const key = `course_detail_${year}_${sem}_${id}`
  const cached = await getStore(key)
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/${year}/${sem}/course/${id}.json`)
  await setStore(key, data)
  return data
}

export async function fetchDepartment(year, sem) {
  const key = `department_${year}_${sem}`
  const cached = await getStore(key)
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/${year}/${sem}/department.json`)
  await setStore(key, data)
  return data
}

export async function fetchWithdrawalRate(period = '') {
  const key = `withdrawalRate${period}`
  const cached = await getStore(key)
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/analytics/withdrawal-rate${period}.json`)
  await setStore(key, data, 30)
  return data
}

export async function fetchWithdrawal(period = '') {
  return fetchJson(`${API_BASE}/analytics/withdrawal${period}.json`)
}

export async function fetchCalendar() {
  return fetchJson(`${API_BASE}/calendar.json`)
}

export async function fetchStandards() {
  const cached = await getStore('standards')
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/standards.json`)
  await setStore('standards', data, 30)
  return data
}

export async function fetchStandardYear(year) {
  const key = `standard_${year}`
  const cached = await getStore(key)
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/${year}/standard.json`)
  await setStore(key, data, 30)
  return data
}

export async function fetchMicroPrograms(year, sem) {
  const key = `mprogram_${year}_${sem}`
  const cached = await getStore(key)
  if (cached) return cached
  const data = await fetchJson(`${API_BASE}/${year}/${sem}/mprogram.json`)
  await setStore(key, data, 30)
  return data
}

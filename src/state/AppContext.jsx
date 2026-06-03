import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCourse, fetchYearData } from '../lib/courseApi.js'
import { departmentItems, storageDepartment } from '../lib/courseUtils.js'
import { readJsonStorage, writeJsonStorage } from '../lib/storage.js'

const AppContext = createContext(null)

function initialDataset() {
  return {
    year: localStorage.getItem('data-year') || '',
    sem: localStorage.getItem('data-sem') || '',
    department: localStorage.getItem('data-department') || 'main',
  }
}

export function AppProvider({ children }) {
  const [dataset, setDatasetState] = useState(initialDataset)
  const [yearSemItems, setYearSemItems] = useState([])
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false)
  const [loadingDataset, setLoadingDataset] = useState(true)
  const [error, setError] = useState(null)

  const setDataset = useCallback((next) => {
    const normalized = {
      year: next.year,
      sem: next.sem,
      department: storageDepartment(next.department || 'main'),
    }
    localStorage.setItem('data-year', normalized.year)
    localStorage.setItem('data-sem', normalized.sem)
    localStorage.setItem('data-department', normalized.department)
    setDatasetState(normalized)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoadingDataset(true)
      try {
        const years = await fetchYearData()
        const items = []
        for (const year of Object.keys(years).reverse()) {
          for (const sem of [...years[year]].reverse()) items.push(`${year}-${sem}`)
        }
        if (cancelled) return
        setYearSemItems(items)
        if (!dataset.year || !dataset.sem) {
          const latestYear = Object.keys(years).at(-1)
          const latestSem = years[latestYear].at(-1)
          setDataset({ year: latestYear, sem: latestSem, department: dataset.department || 'main' })
        }
      } catch (e) {
        setError(e)
        if (!dataset.year || !dataset.sem) setDataset({ year: '112', sem: '1', department: 'main' })
      } finally {
        if (!cancelled) setLoadingDataset(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  const getCourses = useCallback((override = {}) => {
    const year = override.year || dataset.year
    const sem = override.sem || dataset.sem
    const department = override.department || dataset.department
    if (!year || !sem) return Promise.resolve([])
    return fetchCourse(year, sem, department)
  }, [dataset])

  const myCourseKey = useCallback((year = dataset.year, sem = dataset.sem, department = dataset.department) => {
    const suffix = department && department !== 'main' ? `-${department}` : ''
    return `my-couse-data-${year}-${sem}${suffix}`
  }, [dataset])
  const myCourseClassKey = useCallback((year = dataset.year, sem = dataset.sem) => `my-couse-class-${year}-${sem}`, [dataset])

  const getMyCourseIds = useCallback((year = dataset.year, sem = dataset.sem, department = dataset.department) => readJsonStorage(myCourseKey(year, sem, department), []), [dataset, myCourseKey])

  const addCourse = useCallback((id, year = dataset.year, sem = dataset.sem, department = dataset.department) => {
    const key = myCourseKey(year, sem, department)
    const ids = readJsonStorage(key, [])
    if (!ids.includes(id)) writeJsonStorage(key, [...ids, id])
  }, [dataset, myCourseKey])

  const removeCourse = useCallback((id, year = dataset.year, sem = dataset.sem, department = dataset.department) => {
    const key = myCourseKey(year, sem, department)
    writeJsonStorage(key, readJsonStorage(key, []).filter((item) => item !== id))
  }, [dataset, myCourseKey])

  const value = useMemo(() => ({
    dataset,
    setDataset,
    yearSemItems,
    departmentItems,
    datasetDialogOpen,
    setDatasetDialogOpen,
    loadingDataset,
    error,
    getCourses,
    getMyCourseIds,
    addCourse,
    removeCourse,
    myCourseKey,
    myCourseClassKey,
  }), [dataset, setDataset, yearSemItems, datasetDialogOpen, loadingDataset, error, getCourses, getMyCourseIds, addCourse, removeCourse, myCourseKey, myCourseClassKey])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProvider')
  return value
}

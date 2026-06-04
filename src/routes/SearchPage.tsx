import { useEffect, useMemo, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Checkbox } from '../components/ui/checkbox'
import { CourseList } from '../components/CourseList'
import { TimetableSelector } from '../components/TimetableSelector'
import { Alert } from '../components/ui-kit/Alert'
import { Button } from '../components/ui-kit/Button'
import { Card } from '../components/ui-kit/Card'
import { Dialog } from '../components/ui-kit/Dialog'
import { Field } from '../components/ui-kit/Field'
import { Input } from '../components/ui-kit/Input'
import { Loader } from '../components/ui-kit/Loader'
import { categoryFilterList, courseStandard, timetable } from '../lib/courseUtils'
import { createSearchParams, replaceQuery } from '../lib/urlState'
import { useApp } from '../state/AppContext'
import type { Course, QueryValue } from '../types/course'
import { errorMessage } from '../lib/error'

const emptyTimetableFilter: Record<string, string[]> = { mon: [], tue: [], wed: [], thu: [], fri: [] }
const allStandardFilter = {
  '○': true,
  '△': true,
  '☆': true,
  '●': true,
  '▲': true,
  '★': true,
}

export function SearchPage() {
  const { location } = useRouterState()
  const { dataset, getCourses } = useApp()
  const query = useMemo(() => createSearchParams(globalThis.location?.search || location.search), [location.search])
  const initialState = useMemo(() => ({
    q: query.get('q') || '',
    id: query.get('id') || '',
    teacher: query.get('teacher') || '',
    classroom: query.get('classroom') || '',
    hideConflict: Boolean(query.get('hideConflict')),
    category: safeParseJson<string[]>(query.get('category'), []),
    timetable: safeParseJson(query.get('time-table'), emptyTimetableFilter),
  }), [location.search])
  const [searchCourseId, setSearchCourseId] = useState(initialState.id)
  const [searchVal, setSearchVal] = useState(initialState.q)
  const [searchTeacher, setSearchTeacher] = useState(initialState.teacher)
  const [searchClass, setSearchClass] = useState(initialState.classroom)
  const [showConflictCourse, setShowConflictCourse] = useState(!initialState.hideConflict)
  const [categoryFilter, setCategoryFilter] = useState<string[]>(initialState.category)
  const [timetableFilter, setTimetableFilter] = useState<Record<string, string[]>>(initialState.timetable)
  const [courseStandardFilter, setCourseStandardFilter] = useState(allStandardFilter)
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [categoryDialog, setCategoryDialog] = useState(false)
  const [courseStandardDialog, setCourseStandardDialog] = useState(false)
  const [timetableDialog, setTimetableDialog] = useState(false)

  const year = query.get('year') || dataset.year
  const sem = query.get('sem') || dataset.sem
  const department = query.get('d') || dataset.department

  useEffect(() => {
    setSearchCourseId(initialState.id)
    setSearchVal(initialState.q)
    setSearchTeacher(initialState.teacher)
    setSearchClass(initialState.classroom)
    setShowConflictCourse(!initialState.hideConflict)
    setCategoryFilter(initialState.category)
    setTimetableFilter(initialState.timetable)
  }, [initialState])

  useEffect(() => {
    let cancelled = false
    getCourses({ year, sem, department }).then((data) => {
      if (!cancelled) setCourses(data)
    }).catch((e) => {
      if (!cancelled) {
        setError(e)
        setCourses([])
      }
    })
    return () => { cancelled = true }
  }, [year, sem, department, getCourses])

  const result = useMemo(() => {
    if (!courses) return null
    try {
      let data = [...courses]
      if (searchVal) {
        data = data.filter((course) => regexMatch(course.name?.zh, searchVal) || ((course.class || []).some((item) => /體育/.test(item.name)) && regexMatch(course.notes, searchVal)))
      }
      if (searchCourseId) data = data.filter((course) => String(course.id || '').startsWith(searchCourseId))
      if (searchTeacher) data = data.filter((course) => regexMatch((course.teacher || []).map((item) => item.name).join(''), searchTeacher))
      if (searchClass) data = data.filter((course) => regexMatch((course.class || []).map((item) => item.name).join(''), searchClass))
      if (Object.values(timetableFilter).some((items) => items.length)) {
        data = data.filter((course) => {
          for (const date of Object.keys(timetableFilter)) {
            for (const slot of timetable) {
              if (timetableFilter[date].includes(slot) && course.time?.[date]?.includes(slot)) return false
            }
          }
          return true
        })
      }
      if (categoryFilter.length) {
        data = data.filter((course) => (course.class || []).some((item) => /博雅/.test(item.name)) && categoryFilter.some((item) => String(course.notes || '').includes(item)))
      }
      for (const [standard, enabled] of Object.entries(courseStandardFilter)) {
        if (!enabled) data = data.filter((course) => course.courseType !== standard)
      }
      return data
    } catch (e) {
      setError(e)
      return []
    }
  }, [courses, searchVal, searchCourseId, searchTeacher, searchClass, categoryFilter, timetableFilter, courseStandardFilter])

  useEffect(() => {
    const next: Record<string, QueryValue | undefined> = { year, sem, d: department }
    if (searchVal) next.q = searchVal
    if (searchCourseId) next.id = searchCourseId
    if (searchTeacher) next.teacher = searchTeacher
    if (searchClass) next.classroom = searchClass
    if (!showConflictCourse) next.hideConflict = true
    if (Object.values(timetableFilter).some((items) => items.length)) next['time-table'] = JSON.stringify(timetableFilter)
    if (categoryFilter.length) next.category = JSON.stringify(categoryFilter)
    replaceQuery('/search', next)
  }, [searchVal, searchCourseId, searchTeacher, searchClass, showConflictCourse, timetableFilter, categoryFilter, year, sem, department])

  useEffect(() => {
    if (searchClass === '^博雅') setCategoryDialog(false)
  }, [searchClass])

  function resetCategory() {
    setCategoryFilter([])
  }

  function resetStandardDialog() {
    setCourseStandardFilter({ ...allStandardFilter })
  }

  function resetTimetable() {
    setTimetableFilter({ ...emptyTimetableFilter })
  }

  function toggleLesson(date, slot) {
    setTimetableFilter((current) => {
      const next = structuredClone(current)
      if (date && slot) {
        next[date] = toggleArrayValue(next[date], slot)
      } else if (date) {
        next[date] = next[date].length ? [] : timetable.slice(0, -1)
      } else if (slot) {
        const hasSlot = Object.values(next).some((items) => items.includes(slot))
        for (const key of Object.keys(next)) next[key] = hasSlot ? next[key].filter((item) => item !== slot) : [...next[key], slot]
      } else {
        const hasSelection = Object.values(next).some((items) => items.length)
        for (const key of Object.keys(next)) next[key] = hasSelection ? [] : timetable.slice(0, -1)
      }
      return next
    })
  }

  if (result === null) return <Loader />

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">{searchClass === '^博雅' ? '博雅搜尋' : '搜尋'}</h1>
          <p className="mt-2 mb-0 text-sm opacity-75">關鍵字、教師與班級欄位支援 <a href="https://en.wikipedia.org/wiki/Regular_expression" target="_blank" rel="noreferrer">regex</a>。</p>
        </div>
      </div>
      <Card className="px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="課號">
            <Input value={searchCourseId} placeholder="課號" onChange={(event) => setSearchCourseId(event.target.value)} />
          </Field>
          <Field label="關鍵字">
            <Input value={searchVal} placeholder="關鍵字" onChange={(event) => setSearchVal(event.target.value)} />
          </Field>
          <Field label="教師">
            <Input value={searchTeacher} placeholder="教師" onChange={(event) => setSearchTeacher(event.target.value)} />
          </Field>
          <Field label={searchClass === '^博雅' ? '博雅' : '班級'}>
            {searchClass === '^博雅' ? (
              <Button className="m-0 w-full justify-center" onClick={() => setCategoryDialog(true)}><i className="bx bxs-filter-alt" />依博雅類別篩選</Button>
            ) : (
              <Input value={searchClass} placeholder="班級" onChange={(event) => setSearchClass(event.target.value)} />
            )}
          </Field>
          <div className="grid gap-2">
            <span className="text-[0.85em] opacity-75">衝堂</span>
            <label className="inline-flex min-h-9 items-center gap-2 rounded-[12px] border border-[rgba(var(--vs-text),0.1)] px-3 py-2">
              <Checkbox checked={showConflictCourse} onCheckedChange={(checked) => setShowConflictCourse(Boolean(checked))} />
              顯示衝堂課程
            </label>
          </div>
          <Field label="課程標準">
            <Button className="m-0 w-full justify-center" onClick={() => setCourseStandardDialog(true)}><i className="bx bxs-filter-alt" />依課程標準篩選</Button>
          </Field>
          <Field label="上課時間">
            <Button className="m-0 w-full justify-center" onClick={() => setTimetableDialog(true)}><i className="bx bxs-filter-alt" />依時間篩選</Button>
          </Field>
        </div>
      </Card>
      {error ? <Alert danger><strong>搜尋時發生了錯誤</strong><pre>{errorMessage(error)}</pre></Alert> : null}
      <CourseList courses={result} showConflictCourse={showConflictCourse} />

      <Dialog
        open={categoryDialog}
        title="依博雅類別篩選課程"
        onClose={() => setCategoryDialog(false)}
        footer={<div className="flex w-full justify-end gap-2"><Button className="m-0" onClick={resetCategory}>重置</Button><Button primary className="m-0" onClick={() => setCategoryDialog(false)}>完成</Button></div>}
      >
        <div className="grid gap-2">
          {Object.entries(categoryFilterList).map(([key, value]) => (
            <label key={value} className="flex items-center gap-2 rounded-[12px] border border-[rgba(var(--vs-text),0.08)] px-3 py-2">
              <Checkbox checked={categoryFilter.includes(value)} onCheckedChange={() => setCategoryFilter((items) => toggleArrayValue(items, value))} />
              {key}
            </label>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={courseStandardDialog}
        title="依課程標準篩選課程"
        onClose={() => setCourseStandardDialog(false)}
        footer={<div className="flex w-full justify-end gap-2"><Button className="m-0" onClick={resetStandardDialog}>重置</Button><Button primary className="m-0" onClick={() => setCourseStandardDialog(false)}>完成</Button></div>}
      >
        <div className="grid gap-2">
          {Object.entries(courseStandard).map(([symbol, text]) => (
            <label key={symbol} className="flex items-center gap-2 rounded-[12px] border border-[rgba(var(--vs-text),0.08)] px-3 py-2">
              <Checkbox checked={Boolean(courseStandardFilter[symbol])} onCheckedChange={(checked) => setCourseStandardFilter((value) => ({ ...value, [symbol]: Boolean(checked) }))} />
              {symbol} {text}
            </label>
          ))}
        </div>
      </Dialog>

      <Dialog
        open={timetableDialog}
        title="依時間篩選課程"
        onClose={() => setTimetableDialog(false)}
        footer={<div className="flex w-full justify-end gap-2"><Button className="m-0" onClick={resetTimetable}>重置</Button><Button primary className="m-0" onClick={() => setTimetableDialog(false)}>完成</Button></div>}
      >
        <p className="m-0 text-sm opacity-75">點擊課表上的星期或節次可以一次選取整個行或列，點左上角可一次選取整張表。</p>
        <TimetableSelector className="mt-3" value={timetableFilter} onToggle={toggleLesson} />
      </Dialog>
    </div>
  )
}

function regexMatch(value: unknown, pattern: string) {
  try {
    return String(value || '').match(pattern)
  } catch {
    return String(value || '').includes(pattern)
  }
}

function safeParseJson<T>(text: string | null, fallback: T): T {
  if (!text) return fallback
  try {
    const value = JSON.parse(text)
    return value ?? fallback
  } catch {
    return fallback
  }
}

function toggleArrayValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

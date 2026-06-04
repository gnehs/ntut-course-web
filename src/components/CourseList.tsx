import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type React from 'react'
import { cn } from '../lib/utils'
import { animateCourseResults, animateCourseResultsOut } from '../lib/motion'
import {
  courseTitle,
  dateEng2zh,
  getCourseDisplayTitle,
  getGeneralCourseTags,
  getSportsCourseIcon,
  getSportsCourseTitle,
  isSportsCourse,
  parseCourseTime,
  timetable,
  trimEllip,
} from '../lib/courseUtils'
import { useApp } from '../state/AppContext'
import { Button } from './ui-kit/Button'
import { Card } from './ui-kit/Card'
import { CardTitle } from './ui-kit/CardTitle'
import { Pagination } from './ui-kit/Pagination'
import { Tag } from './ui-kit/Tag'
import type { Course } from '../types/course'

const PAGE_SIZE = 54

type CourseListProps = {
  courses: Course[] | null
  showTimetable?: boolean
  showConflictCourse?: boolean
  year?: string
  sem?: string
}

type TimetableCourseItem = Course & {
  date: string
  slots: string[]
  isConflict: boolean
}

export function CourseList({ courses, showTimetable = false, showConflictCourse = true, year, sem }: CourseListProps) {
  const { dataset, getCourses, getMyCourseIds } = useApp()
  const [layout, setLayout] = useState('card')
  const [page, setPage] = useState(1)
  const [conflictCourseData, setConflictCourseData] = useState<string[]>([])
  const resultSurfaceRef = useRef<HTMLDivElement | null>(null)
  const resultTransitionRef = useRef(Promise.resolve())
  const viewYear = year || dataset.year
  const viewSem = sem || dataset.sem

  useEffect(() => {
    let cancelled = false
    async function checkConflict() {
      const ids = getMyCourseIds(viewYear, viewSem)
      const myCourses = (await getCourses({ year: viewYear, sem: viewSem })).filter((course) => ids.includes(course.id))
      const conflicts: string[] = []
      for (const course of courses || []) {
        for (const myCourse of myCourses) {
          if (course.id !== myCourse.id && hasConflict(course, myCourse) && !conflicts.includes(course.id)) conflicts.push(course.id)
        }
      }
      if (!cancelled) setConflictCourseData(conflicts)
    }
    checkConflict().catch(() => setConflictCourseData([]))
    return () => {
      cancelled = true
    }
  }, [courses, viewYear, viewSem, dataset.department])

  const filteredCourse = useMemo(() => {
    if (!courses) return []
    return showConflictCourse ? courses : courses.filter((course) => !conflictCourseData.includes(course.id))
  }, [courses, showConflictCourse, conflictCourseData])

  const pageCount = Math.max(Math.ceil(filteredCourse.length / PAGE_SIZE), 1)
  const pageItems = filteredCourse.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > pageCount) setPage(1)
  }, [page, pageCount])

  function transitionResults(update: () => void) {
    resultTransitionRef.current = resultTransitionRef.current
      .then(() => animateCourseResultsOut(resultSurfaceRef.current))
      .then(() => {
        flushSync(update)
        requestAnimationFrame(() => animateCourseResults(resultSurfaceRef.current))
      })
  }

  function changeLayout(nextLayout: string) {
    if (nextLayout === layout) return
    transitionResults(() => {
      setLayout(nextLayout)
      setPage(1)
    })
  }

  function changePage(nextPage: number) {
    if (nextPage === page) return
    transitionResults(() => setPage(nextPage))
  }

  if (!courses) return null

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-1 py-4">
        <Button active={layout === 'table'} className="m-0" onClick={() => changeLayout('table')}><i className="bx bx-table" />表格</Button>
        <Button active={layout === 'card'} className="m-0" onClick={() => changeLayout('card')}><i className="bx bx-card" />卡片</Button>
        {showTimetable ? <Button active={layout === 'timetable'} className="m-0" onClick={() => changeLayout('timetable')}><i className="bx bx-time" />課表</Button> : null}
      </div>
      <div ref={resultSurfaceRef}>
        {layout === 'card' ? (
          <>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
            {pageItems.map((course) => (
              <Card
                key={course.id}
                data-course-result-item
                to={`/course/${viewYear}/${viewSem}/${course.id}`}
                className="cursor-pointer px-4 py-3 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] active:translate-y-[5px] active:shadow-none"
              >
                <CardTitle spaceBetween>
                  <CourseDisplayHeading course={course} />
                  {conflictCourseData.includes(course.id) ? <Tag color="rgba(var(--vs-danger),0.15)" textColor={`rgb(var(--vs-danger))`}><i className="bx bxs-error" />衝堂</Tag> : null}
                </CardTitle>
                <CourseTags course={course} />
                <div className="mt-2 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(86px,1fr))]">
                  <Card className="border-0 bg-transparent px-0 py-1 shadow-none"><CardTitle>{course.id}</CardTitle><p>課號</p></Card>
                  <Card className="border-0 bg-transparent px-0 py-1 shadow-none"><CardTitle>{course.credit}</CardTitle><p>學分</p></Card>
                  {parseCourseTime(course.time).map((item) => <Card key={item.title} className="border-0 bg-transparent px-0 py-1 shadow-none"><CardTitle>{item.content}</CardTitle><p>{item.title}</p></Card>)}
                  {!parseCourseTime(course.time).length ? <Card className="border-0 bg-transparent px-0 py-1 shadow-none"><CardTitle>無資料</CardTitle><p>上課時間</p></Card> : null}
                </div>
                <p>
                  班級：{trimEllip((course.class || []).map((item) => item.name).join('、'), 9)}<br />
                  教師：{trimEllip((course.teacher || []).map((item) => item.name).join('、'), 13)}<br />
                  備註：{trimEllip(course.notes, 15)}
                </p>
              </Card>
            ))}
          </div>
          {!filteredCourse.length ? <div className="flex items-center justify-center p-5"><p>查無資料</p></div> : null}
          <Pagination page={page} length={pageCount} onChange={changePage} />
          </>
        ) : null}
        {layout === 'table' ? (
          <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">課號</th>
                  <th className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">課程名稱</th>
                  <th className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">教師</th>
                  <th className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">班級</th>
                  <th className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">備註</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((course) => (
                  <tr key={course.id} data-course-result-item className="transition-colors hover:bg-[rgba(var(--vs-text),0.04)]">
                    <td className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">{course.id}</td>
                    <td className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2"><Link to={`/course/${viewYear}/${viewSem}/${course.id}`}>{courseTitle(course)}</Link></td>
                    <td className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">{trimEllip((course.teacher || []).map((item) => item.name).join('、'), 9)}</td>
                    <td className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">{trimEllip((course.class || []).map((item) => item.name).join('、'), 9)}</td>
                    <td className="border-b border-[rgba(var(--vs-text),0.08)] px-3 py-2">{conflictCourseData.includes(course.id) ? <span className="text-[rgb(var(--vs-danger))]">衝堂</span> : course.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} length={pageCount} onChange={changePage} />
          </Card>
        ) : null}
        {layout === 'timetable' ? <TimetableCourses courses={filteredCourse} year={viewYear} sem={viewSem} /> : null}
      </div>
    </div>
  )
}

function CourseDisplayHeading({ course }: { course: Course }) {
  if (isSportsCourse(course)) {
    const title = getSportsCourseTitle(course)
    const icon = getSportsCourseIcon(title)
    return (
      <span className="flex items-center gap-1">
        {icon ? <i className={cn(icon, 'text-base')} /> : null}
        <span>{title}</span>
      </span>
    )
  }
  return <span>{getCourseDisplayTitle(course)}</span>
}

function CourseTags({ course }: { course: Course }) {
  const tags = getGeneralCourseTags(course)
  if (!tags.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag) => <Tag key={tag.name} color={tag.color} textColor={tag.textColor}>{tag.name}</Tag>)}
    </div>
  )
}

function hasConflict(a: Course, b: Course) {
  for (const [date, slots] of Object.entries(a.time || {}) as [string, string[]][]) {
    for (const slot of slots || []) {
      if (b.time?.[date]?.includes(slot)) return true
    }
  }
  return false
}

function TimetableCourses({ courses, year, sem }: { courses: Course[]; year: string; sem: string }) {
  const weekdays = Object.keys(dateEng2zh).filter((date) => courses.some((course) => course.time?.[date]?.length))
  const items: TimetableCourseItem[] = []
  const occupied = new Map<string, TimetableCourseItem>()
  for (const course of courses) {
    for (const [date, slots] of Object.entries(course.time || {}) as [string, string[]][]) {
      if (!slots.length) continue
      const key = `${date}-${slots.join(',')}`
      if (occupied.has(key)) {
        const occupiedItem = occupied.get(key)
        if (occupiedItem) occupiedItem.isConflict = true
      } else {
        const item: TimetableCourseItem = { ...course, date, slots, isConflict: false }
        occupied.set(key, item)
        items.push(item)
      }
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div
        className="grid gap-2 bg-[rgba(var(--vs-text),0.02)] p-2"
        style={{
          gridTemplateColumns: ['[time]', 'auto', weekdays.map((item) => `[${dateEng2zh[item].slice(1)}] 1fr`).join(' '), '[end]'].join(' '),
          gridTemplateRows: ['[weekday] auto', ...timetable.map((item) => `[slot${item}] auto`), '[end]'].join(' '),
        }}
      >
        <div className="bg-[rgba(var(--vs-text),0.05)]" style={{ gridColumn: 'time / end', gridRow: 'weekday' }} />
        {timetable.map((time) => (
          <div
            key={time}
            className="flex min-h-[3em] items-center justify-center px-1 text-[0.85em]"
            style={{ gridColumn: 'time', gridRow: `slot${time}` }}
          >
            {time}
          </div>
        ))}
        {weekdays.map((date) => (
          <div
            key={date}
            className="px-4 py-2 text-center text-[0.85em]"
            style={{ gridColumn: dateEng2zh[date].slice(1), gridRow: 'weekday' }}
          >
            {dateEng2zh[date].slice(1)}
          </div>
        ))}
        {items.map((item) => {
          const start = item.slots[0]
          const lastSlot = item.slots[item.slots.length - 1]
          const end = lastSlot ? timetable[timetable.indexOf(lastSlot) + 1] || 'end' : 'end'
          return (
            <Link
              key={`${item.id}-${item.date}-${item.slots.join('-')}`}
              data-course-result-item
              to={`/course/${year}/${sem}/${item.id}`}
              className={cn(
                'relative z-[1] flex h-full w-full flex-col justify-between gap-1 rounded-[8px] px-2 py-3 text-left no-underline backdrop-blur-[2px] transition-colors',
                item.isConflict
                  ? 'pointer-events-none bg-red-600 text-white'
                  : 'bg-[rgba(var(--vs-primary),0.15)] text-[rgba(var(--vs-text),0.9)] hover:bg-[rgba(var(--vs-primary),0.22)]'
              )}
              style={{ gridColumn: dateEng2zh[item.date].slice(1), gridRow: `slot${start} / slot${end}` }}
            >
              <div className="font-bold">{item.isConflict ? '含有多個課程' : item.name?.zh || '未命名課程'}</div>
              <div className="text-[0.85em] opacity-75">{item.isConflict ? '無法顯示課程，請使用其他模式檢視' : (item.teacher || []).map((x) => x.name).join('、')}</div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

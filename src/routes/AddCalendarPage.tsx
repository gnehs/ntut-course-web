import { useEffect, useMemo, useState } from 'react'
import { Alert } from '../components/ui-kit/Alert'
import { Button } from '../components/ui-kit/Button'
import { Card } from '../components/ui-kit/Card'
import { CardTitle } from '../components/ui-kit/CardTitle'
import { Field } from '../components/ui-kit/Field'
import { Input } from '../components/ui-kit/Input'
import { StepsPageSkeleton } from '../components/ui-kit/PageSkeletons'
import { fetchCalendar } from '../lib/courseApi'
import { buildCourseCalendar, trimEllip } from '../lib/courseUtils'
import { useApp } from '../state/AppContext'
import type { CalendarCourse, CalendarEvent } from '../types/course'

export function AddCalendarPage() {
  const { dataset, getCourses, getMyCourseIds } = useApp()
  const [courses, setCourses] = useState<CalendarCourse[] | null>(null)
  const [start, setStart] = useState('')
  const [until, setUntil] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [calendar, allCourses] = await Promise.all([fetchCalendar(), getCourses()])
      const ids = getMyCourseIds()
      const myCourses = allCourses.filter((course) => ids.includes(course.id))
      const origin = globalThis.location?.origin || 'https://ntut-course.gnehs.net'
      const startDate = resolveStartDate(calendar, dataset.year, dataset.sem)
      const endDate = resolveEndDate(calendar, dataset.year, dataset.sem)
      if (!cancelled) {
        setCourses(myCourses.map((course) => ({
          id: course.id,
          courseType: course.courseType,
          name: course.name?.zh || '',
          description: course.description?.zh || '',
          time: course.time,
          teacher: trimEllip((course.teacher || []).map((item) => item.name).join('、'), 13),
          classroom: trimEllip((course.classroom || []).map((item) => item.name).join('、'), 13),
          link: `${origin}/course/${dataset.year}/${dataset.sem}/${course.id}`,
        })))
        setSelectedIds(myCourses.map((course) => course.id))
        setStart(startDate)
        setUntil(endDate)
      }
    }
    load().catch(() => setCourses([]))
    return () => { cancelled = true }
  }, [dataset.year, dataset.sem, dataset.department])

  const selectedCourses = useMemo(() => (courses || []).filter((course) => selectedIds.includes(course.id)), [courses, selectedIds])

  function downloadIcs() {
    try {
      window.gtag?.('event', 'download_calendar', { event_category: 'calendar', event_label: 'download_calendar', value: selectedCourses.length })
    } catch {}
    const ics = buildCourseCalendar({
      courses: selectedCourses,
      startDate: start,
      untilDate: until,
      year: dataset.year,
      sem: dataset.sem,
    })
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataset.year}-${dataset.sem}-course.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!courses) return <StepsPageSkeleton />
  return (
    <div>
      <h1>新增到行事曆</h1>
      <p>注意：如果你變更了課程，需要重新新增課程到行事曆！</p>
      {!courses.length ? <Alert danger><strong>沒有課程資料</strong><br />請先新增課程資料</Alert> : null}
      <h2><span style={{ color: 'rgb(var(--vs-primary))' }}>Step 0</span> 加入課程</h2>
      <p>請先將你本學期的課程新增到 <strong>北科課程好朋友</strong></p>
      <h2><span style={{ color: 'rgb(var(--vs-primary))' }}>Step 1</span> 請選擇要加入的課程</h2>
      <div className="grid gap-2">
        {courses.map((course) => (
          <label key={course.id} className="flex items-center gap-2 rounded-[8px] border border-[rgba(var(--vs-text),0.1)] bg-[rgb(var(--vs-background))] px-3 py-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(course.id)}
              onChange={() => setSelectedIds((ids) => ids.includes(course.id) ? ids.filter((id) => id !== course.id) : [...ids, course.id])}
            /> {course.name}
          </label>
        ))}
      </div>
      <h2><span style={{ color: 'rgb(var(--vs-primary))' }}>Step 2</span> 新增專用行事曆</h2>
      <p>建議建立專用的行事曆，未來若需移除課程時僅需刪除該行事曆即可。</p>
      <h2><span style={{ color: 'rgb(var(--vs-primary))' }}>Step 3</span> 填寫行程期間</h2>
      <p>這裡通常會自動填上開學日與最後上課日，若有誤請自行修改。</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><p>開學日</p><Input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></Card>
        <Card><p>最後上課日</p><Input type="date" value={until} onChange={(event) => setUntil(event.target.value)} /></Card>
      </div>
      <h2><span style={{ color: 'rgb(var(--vs-primary))' }}>Step 4</span> 匯入至行事曆</h2>
      <p>輕觸「匯入」按鈕以繼續，匯入流程根據系統與提供商有所不同，請查詢行事曆提供商之說明來了解如何匯入。</p>
      <Button primary disabled={!selectedCourses.length} onClick={downloadIcs}>匯入</Button>
      <h2>已知問題</h2>
      <p>目前尚未撰寫跳過連假的功能，因此遇到連假時行事曆上仍會有課程。</p>
    </div>
  )
}

function resolveStartDate(calendar: CalendarEvent[], rocYear: string, sem: string) {
  const startDays = calendar.filter((item) => item.summary?.includes('開學')).map((item) => item.start)
  const target = semesterDate(rocYear, sem, 'start')
  return startDays.find((item) => new Date(item) >= target) || isoDate(target)
}

function resolveEndDate(calendar: CalendarEvent[], rocYear: string, sem: string) {
  const endDays = calendar.filter((item) => item.summary === '期末考試').map((item) => item.end)
  const target = semesterDate(rocYear, sem, 'end')
  return endDays.find((item) => new Date(item) >= target) || isoDate(target)
}

function semesterDate(rocYear: string, sem: string, type: 'start' | 'end') {
  let year = Number(rocYear) + 1911
  if (sem === '2') year += 1
  if (sem === '1') return type === 'start' ? new Date(year, 7, 2) : new Date(year + 1, 0, 2)
  return type === 'start' ? new Date(year, 0, 2) : new Date(year, 5, 31)
}

function isoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

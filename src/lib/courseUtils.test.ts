import { describe, expect, it } from 'vitest'
import { buildCourseCalendar, filterPlaceholderCourses, parseCourseTime, parseYearSemVal, searchCourseList, trimEllip } from './courseUtils'

describe('courseUtils', () => {
  it('formats year and semester labels', () => {
    expect(parseYearSemVal('112-1')).toBe('112 年上學期')
    expect(parseYearSemVal('112-2')).toBe('112 年下學期')
  })

  it('trims long labels with ellipsis', () => {
    expect(trimEllip('北科課程好朋友', 4)).toBe('北科課程...')
  })

  it('parses course time by weekday', () => {
    expect(parseCourseTime({ mon: ['1', '2'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] })).toEqual([{ title: '週一', content: '1~2' }])
  })

  it('searches course ids, names and teachers', () => {
    const courses = [{ id: '123456', name: { zh: '微積分' }, teacher: [{ name: '王老師' }], class: [], classroom: [], notes: '' }]
    expect(searchCourseList(courses, '123').length).toBe(1)
    expect(searchCourseList(courses, '王老師').length).toBe(1)
    expect(searchCourseList(courses, '英文').length).toBe(0)
  })

  it('filters placeholder courses', () => {
    expect(filterPlaceholderCourses([{ id: 'placeholder-1' }, { id: '123' }])).toEqual([{ id: '123' }])
  })

  it('builds weekly course calendar events with Taipei timezone', () => {
    const calendar = buildCourseCalendar({
      year: '112',
      sem: '1',
      startDate: '2023-09-04',
      untilDate: '2024-01-12',
      courses: [{
        id: '123456',
        name: '微積分',
        description: '課程說明',
        classroom: '共同科館',
        link: 'https://ntut-course.gnehs.net/course/112/1/123456',
        time: { mon: ['1', '2'], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
      }],
    })
    expect(calendar).toContain('X-WR-CALNAME:112 學年度上學期課程')
    expect(calendar).toContain('DTSTART;TZID=Asia/Taipei:20230904T081000')
    expect(calendar).toContain('DTEND;TZID=Asia/Taipei:20230904T100000')
    expect(calendar).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1;UNTIL=20240112T000000')
  })
})

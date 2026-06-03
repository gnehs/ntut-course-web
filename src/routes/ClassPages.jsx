import { AdsByGoogle } from '../components/AdsByGoogle.jsx'
import { Link, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { CourseList } from '../components/CourseList.jsx'
import { Alert, Button, Card, CardTitle, Input, Loader } from '../components/UI.jsx'
import { fetchCourse, fetchDepartment } from '../lib/courseApi.js'
import { useApp } from '../state/AppContext.jsx'

export function ClassIndexPage() {
  const { dataset, myCourseClassKey, getCourses } = useApp()
  const [departments, setDepartments] = useState(null)
  const [recommendClass, setRecommendClass] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchDepartment(dataset.year, dataset.sem)
        if (cancelled) return
        setDepartments(data)
        const classData = data.flatMap((department) => department.class || [])
        const savedClassName = localStorage.getItem(myCourseClassKey())
        if (savedClassName && !localStorage.getItem('my-class')) {
          const found = classData.find((item) => item.name === savedClassName)
          if (found) localStorage.setItem('my-class', found.id)
        }
        const classId = localStorage.getItem('my-class')
        const userClass = classData.find((item) => item.id === classId || item.name === savedClassName)
        const recommendations = []
        if (userClass) {
          recommendations.push({ ...userClass, description: '你的班級' })
          const courses = await getCourses({ year: dataset.year, sem: dataset.sem })
          const generalEducationClassNames = courses
            .filter((course) => (course.class || []).some((item) => item.name === userClass.name))
            .filter((course) => course.notes && course.notes.startsWith('請選：通識中心'))
            .map((course) => course.notes.replace('請選：通識中心', '').replace(/ |\//g, ''))
          for (const name of [...new Set(generalEducationClassNames)]) {
            const found = classData.find((item) => item.name.replace(/ |\//g, '') === name)
            if (found) recommendations.push({ ...found, description: '博雅課程' })
          }
        }
        setRecommendClass(recommendations)
      } catch (e) {
        if (!cancelled) {
          setError(e)
          setDepartments([])
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [dataset.year, dataset.sem])

  const filteredDepartmentData = useMemo(() => {
    if (!departments) return null
    if (!filter) return departments
    try {
      return departments
        .filter((department) => department.name.match(filter) || (department.class || []).map((item) => item.name).join('').match(filter))
        .map((department) => ({ ...department, class: (department.class || []).filter((item) => item.name.match(filter)) }))
        .filter((department) => department.class.length)
    } catch (e) {
      setError(e)
      return []
    }
  }, [departments, filter])

  if (!departments) return <Loader />

  return (
    <div>
      <h1>選擇班級</h1>
      <div className="cards" style={{ '--card-row': 4, '--card-row-sm': 1 }}>
        <Card>
          <p>輸入關鍵字來篩選</p>
          <Input value={filter} onChange={(event) => setFilter(event.target.value)} />
        </Card>
      </div>
      {error ? <Alert danger><strong>搜尋時發生了錯誤</strong><pre>{String(error.message || error || 'Error')}</pre></Alert> : null}
      {recommendClass.length ? (
        <>
          <h3>建議</h3>
          <p>根據你先前儲存的班級所提供的建議</p>
          <div className="cards" style={{ '--card-row': 5, '--card-row-sm': 3 }}>
            {recommendClass.map((item, index) => (
              <Card className="hoverable padding" key={`${item.id}-${index}`} to={`/class/${dataset.year}/${dataset.sem}/${item.name}?d=${dataset.department}`}>
                <CardTitle>{item.name}</CardTitle>
                <p>{item.description}</p>
                <i className="bx bx-star" />
              </Card>
            ))}
          </div>
        </>
      ) : null}
      {(filteredDepartmentData || []).map((department) => (
        <div key={department.name}>
          <h3>{department.name}</h3>
          <div className="cards" style={{ '--card-row': 5, '--card-row-sm': 3 }}>
            {(department.class || []).map(({ name }) => (
              <Card className="hoverable padding" key={name} to={`/class/${dataset.year}/${dataset.sem}/${name}?d=${dataset.department}`}>
                <CardTitle>{name}</CardTitle>
                <p>{department.name}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ClassDetailPage() {
  const { year, sem, id } = useParams({ from: '/class/$year/$sem/$id' })
  const { dataset, addCourse, removeCourse, myCourseClassKey } = useApp()
  const [courses, setCourses] = useState(null)
  const [classData, setClassData] = useState(null)
  const [version, setVersion] = useState(0)
  const isInMyCourse = localStorage.getItem(myCourseClassKey(year, sem)) === id

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [departments, allCourses] = await Promise.all([fetchDepartment(year, sem), fetchCourse(year, sem, dataset.department)])
      const foundClass = departments.flatMap((item) => item.class || []).find((item) => item.name === id || item.id === id)
      const result = allCourses.filter((course) => (course.class || []).some((item) => item.name === id || item.id === id))
      if (!cancelled) {
        setClassData(foundClass)
        setCourses(result)
      }
    }
    load().catch(() => setCourses([]))
    return () => { cancelled = true }
  }, [year, sem, id, version, dataset.department])

  function addClassCourses() {
    const previous = localStorage.getItem(myCourseClassKey(year, sem))
    if (previous && previous !== id && !confirm(`你先前已將「${previous}」之課程加入我的課程，此行為會導致課程過多，要繼續嗎？`)) {
      return
    }
    localStorage.setItem('my-class', classData?.id || id)
    localStorage.setItem(myCourseClassKey(year, sem), id)
    for (const course of courses || []) addCourse(course.id, year, sem, dataset.department)
    setVersion((value) => value + 1)
  }

  function removeClassCourses() {
    for (const course of courses || []) removeCourse(course.id, year, sem, dataset.department)
    localStorage.removeItem(myCourseClassKey(year, sem))
    setVersion((value) => value + 1)
  }

  if (!courses) return <Loader />
  const courseGroups = groupClassCourses(courses)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h1>{id}</h1></div>
        <div className="flex flex-wrap justify-end">
          {!isInMyCourse ? <Button primary onClick={addClassCourses}>加入到我的課程</Button> : <Button danger onClick={removeClassCourses}>從我的課程中移除</Button>}
        </div>
      </div>
      {!courses.length && classData ? <Alert>此班級目前沒有課程。</Alert> : null}
      {courseGroups.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <CourseList courses={group.courses} showTimetable year={year} sem={sem} />
        </section>
      ))}
      <h3>贊助商廣告</h3>
      <AdsByGoogle />
    </div>
  )
}

function groupClassCourses(courses) {
  const groups = [
    { title: '共同必修', match: (course) => ['○', '△'].includes(course.courseType), courses: [] },
    { title: '專業必修', match: (course) => ['●', '▲'].includes(course.courseType), courses: [] },
    { title: '選修', match: (course) => ['☆', '★'].includes(course.courseType), courses: [] },
    { title: '博雅課程', match: (course) => (course.class || []).some((item) => /^博雅/.test(item.name)), courses: [] },
    { title: '其他課程', match: () => true, courses: [] },
  ]
  for (const course of courses) {
    const group = groups.find((item) => item.match(course))
    group.courses.push(course)
  }
  return groups.filter((group) => group.courses.length)
}

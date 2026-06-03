import { useRouterState } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Card, CardTitle, Loader } from '../components/UI.jsx'
import { fetchStandards, fetchStandardYear } from '../lib/courseApi.js'
import { createSearchParams, pushQuery } from '../lib/urlState.js'

export function StandardPage() {
  const { location } = useRouterState()
  const params = useMemo(() => createSearchParams(globalThis.location?.search || location.search), [location.search])
  const [years, setYears] = useState(null)
  const [error, setError] = useState(null)
  const [year, setYear] = useState(params.get('year') || '')
  const [standardData, setStandardData] = useState(null)
  const [system, setSystem] = useState(params.get('system') || '')
  const [department, setDepartment] = useState(params.get('department') || '')
  useEffect(() => {
    fetchStandards().then(setYears).catch((value) => {
      setError(value)
      setYears({})
    })
  }, [])
  useEffect(() => {
    if (!year) return
    setStandardData(null)
    fetchStandardYear(year).then(setStandardData).catch((value) => {
      setError(value)
      setStandardData({})
    })
  }, [year])
  const systems = Object.keys(standardData || {})
  const departments = system ? Object.keys(standardData?.[system] || {}).sort((a, b) => a.localeCompare(b)).sort((a, b) => a.length - b.length) : []
  const current = useMemo(() => {
    const data = system && department ? structuredClone(standardData?.[system]?.[department]) : null
    if (!data) return null
    const grouped = {}
    for (const course of data.courses || []) {
      if (!grouped[course.year]) grouped[course.year] = {}
      if (!grouped[course.year][course.sem]) grouped[course.year][course.sem] = []
      grouped[course.year][course.sem].push(course)
    }
    return { ...data, courses: grouped }
  }, [standardData, system, department])
  useEffect(() => {
    if (year && system && department) localStorage.setItem('data-standard-query', JSON.stringify({ year, system, department }))
  }, [year, system, department])
  const yearItems = useMemo(() => {
    if (!years) return []
    return Array.isArray(years) ? [...years] : Object.keys(years).reverse()
  }, [years])
  function setQuery(next) {
    const query = { year, system, department, ...next }
    for (const key of Object.keys(query)) if (!query[key]) delete query[key]
    setYear(query.year || '')
    setSystem(query.system || '')
    setDepartment(query.department || '')
    pushQuery('/standard', query)
  }
  return (
    <div>
      <h1>課程標準</h1>
      {error ? <Alert danger><strong>發生了錯誤</strong><pre>{String(error.message || error || 'Error')}</pre></Alert> : null}
      {!years ? <Loader /> : null}
      {year ? (
        <>
          <h3>已選擇的項目 <span style={{ fontSize: '.8em', opacity: .7, fontWeight: 'normal' }}>點擊來取消</span></h3>
          <div className="cards" style={{ '--card-row': 5, '--card-row-sm': 3 }}>
            <Card className="hoverable padding" onClick={() => setQuery({ year: '', system: '', department: '' })}><CardTitle>{formatRocYear(year)}</CardTitle><p>年</p></Card>
            {system ? <Card className="hoverable padding" onClick={() => setQuery({ system: '', department: '' })}><CardTitle>{system}</CardTitle><p>學制</p></Card> : null}
            {department ? <Card className="hoverable padding" onClick={() => setQuery({ department: '' })}><CardTitle>{department}</CardTitle><p>科系</p></Card> : null}
          </div>
        </>
      ) : null}
      {years && !year ? (
        <>
          <h3>選擇入學年度</h3>
          <div className="overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]">
            {yearItems.map((item, index) => (
              <div key={item} onClick={() => setQuery({ year: item })} className={`cursor-pointer px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''} hover:bg-[rgba(var(--vs-text),0.05)]`}>
                {formatRocYear(item)}
              </div>
            ))}
          </div>
        </>
      ) : null}
      {year && !standardData ? <Loader /> : null}
      {standardData && !system ? (
        <>
          <h3>選擇學制</h3>
          <div className="overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]">
            {systems.map((item, index) => (
              <div key={item} onClick={() => setQuery({ system: item })} className={`cursor-pointer px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''} hover:bg-[rgba(var(--vs-text),0.05)]`}>
                {item}
              </div>
            ))}
          </div>
        </>
      ) : null}
      {standardData && system && !department ? (
        <>
          <h3>選擇系所</h3>
          <div className="overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]">
            {departments.map((item, index) => (
              <div key={item} onClick={() => setQuery({ department: item })} className={`cursor-pointer px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''} hover:bg-[rgba(var(--vs-text),0.05)]`}>
                {item}
              </div>
            ))}
          </div>
        </>
      ) : null}
      {department && current ? (
        <>
          <h3>{department}</h3>
          <div className="cards" style={{ '--card-row': 5, '--card-row-sm': 3 }}>
            {Object.entries(current.credits || {}).filter(([, value]) => value !== 0).map(([key, value]) => <Card key={key}><CardTitle>{value}</CardTitle><p>{key}</p></Card>)}
          </div>
          <h3>相關規定事項</h3>
          {(current.rules || []).length ? <ul>{current.rules.map((item) => <li key={item}>{item}</li>)}</ul> : <Alert>無相關規定事項</Alert>}
          <h3>課程</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(current.courses || {}).map(([courseYear, yearData]) => (
              <div key={courseYear} className="flex-1">
                {Object.entries(yearData).map(([sem, items]) => (
                  <div key={`${courseYear}-${sem}`} style={{ marginBottom: '1rem' }}>
                    <h4>{courseYear} 年級{sem === '1' ? '上' : '下'}學期</h4>
                    <div className="overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]">
                      {items.map((item, index) => (
                        <div className={`flex items-center justify-between gap-2 px-4 py-3 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`} key={`${item.type}-${item.name}`}>
                          <span>{item.type} {item.name}</span>
                          <span>{item.credit} 學分</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function formatRocYear(value) {
  const text = String(value || '')
  return /^\d+$/.test(text) ? `${text} 年` : text
}

import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { gsap } from 'gsap'
import { useEffect, useMemo, useRef, useState } from 'react'
import { displayDepartment, parseYearSemVal, storageDepartment } from '../lib/courseUtils.js'
import { animateRouteSurface, isReducedMotion } from '../lib/motion.js'
import { createSearchParams } from '../lib/urlState.js'
import { useApp } from '../state/AppContext.jsx'
import { Button } from './ui-kit/Button.jsx'
import { ContentSurface } from './ui-kit/ContentSurface.jsx'
import { Dialog } from './ui-kit/Dialog.jsx'
import { Field } from './ui-kit/Field.jsx'
import { Select } from './ui-kit/Select.jsx'
import { UniversalSearch } from './UniversalSearch.jsx'

export function Layout() {
  const { location } = useRouterState()
  const searchParams = createSearchParams(globalThis.location?.search || location.search)
  const isIframe = searchParams.get('mode') === 'iframe'
  const isAdvancedSearch = location.pathname === '/advanced-search'
  const { dataset, setDataset, yearSemItems, departmentItems, datasetDialogOpen, setDatasetDialogOpen } = useApp()
  const [yearSemValue, setYearSemValue] = useState(`${dataset.year}-${dataset.sem}`)
  const [departmentValue, setDepartmentValue] = useState(displayDepartment(dataset.department))
  const navRef = useRef(null)
  const mainRef = useRef(null)

  const yearSemLabel = useMemo(() => parseYearSemVal(`${dataset.year}-${dataset.sem}`), [dataset])

  useEffect(() => {
    if (isReducedMotion() || !navRef.current) return undefined
    gsap.fromTo(
      navRef.current,
      { autoAlpha: 0, y: -14 },
      { autoAlpha: 1, y: 0, duration: 0.42, ease: 'power3.out', overwrite: 'auto' }
    )
    return () => gsap.killTweensOf(navRef.current)
  }, [])

  useEffect(() => {
    return animateRouteSurface(mainRef.current)
  }, [location.pathname, location.search])

  function applyDataset() {
    const [year, sem] = yearSemValue.split('-')
    setDataset({ year, sem, department: storageDepartment(departmentValue) })
    setDatasetDialogOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7f8] text-black dark:bg-[#1d1d1d] dark:text-white">
      {!isIframe && !isAdvancedSearch ? (
        <nav
          ref={navRef}
          className="fixed inset-x-0 top-0 z-20 grid h-[58px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-[rgba(var(--vs-background),0.9)] px-4 py-2 shadow-[0_5px_25px_0_rgba(0,0,0,var(--vs-shadow-opacity))] backdrop-blur-[16px] md:grid-cols-[1fr_minmax(250px,430px)_1fr]"
          style={{ paddingInline: 'max(16px, calc((100vw - 1024px) / 2))' }}
        >
          <Link to="/" className="block min-w-0 truncate whitespace-nowrap font-bold text-[rgb(var(--vs-text))] no-underline hover:text-[rgba(var(--vs-text),0.8)]">🍤 北科課程好朋友</Link>
          <div className="hidden md:block"><UniversalSearch navbar /></div>
          <div className="flex justify-end">
            <Button className="m-0 whitespace-nowrap" onClick={() => setDatasetDialogOpen(true)}>{yearSemLabel}</Button>
          </div>
        </nav>
      ) : null}
      <ContentSurface as="main" ref={mainRef} className={`${isAdvancedSearch ? 'w-full' : 'mx-auto w-full max-w-[1024px] px-4 pt-[74px]' } ${isIframe ? 'pt-0' : ''}`}>
        <Outlet />
      </ContentSurface>
      {isIframe && !isAdvancedSearch ? (
        <div className="my-4 text-center text-[0.75em] opacity-75">本資料由 <a href="https://ntut-course.gnehs.net/" target="_blank" rel="noreferrer">北科課程好朋友</a> 提供</div>
      ) : null}
      {!isIframe && !isAdvancedSearch ? (
        <footer className="mx-auto mt-2 w-full rounded-t-[15px] bg-[rgb(var(--vs-background))] px-[15px] py-0 text-center text-sm opacity-70 shadow-[0_5px_25px_0_rgba(0,0,0,var(--vs-shadow-opacity))]">
          <div className="flex items-center justify-between gap-2 py-2">
            <div>Developed by <a href="https://gnehs.net" target="_blank" rel="noreferrer" className="ml-[0.2em]">勝勝</a></div>
            <div className="flex justify-end">
              <Button as="a" icon className="m-0" href="https://github.com/gnehs/ntut-course-web" target="_blank" rel="noreferrer"><i className="bx bxl-github" /></Button>
            </div>
          </div>
        </footer>
      ) : null}
      <Dialog
        open={datasetDialogOpen}
        title="選擇資料集"
        onClose={() => setDatasetDialogOpen(false)}
        footer={<Button primary className="m-0 w-full" onClick={applyDataset}>完成</Button>}
      >
        <div className="grid gap-3">
          <Field label="學期">
            <Select value={yearSemValue} onChange={(event) => setYearSemValue(event.target.value)}>
              {yearSemItems.map((item) => <option key={item} value={item}>{parseYearSemVal(item)}</option>)}
            </Select>
          </Field>
          <Field label="學制">
            <Select value={departmentValue} onChange={(event) => setDepartmentValue(event.target.value)}>
              {departmentItems.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  )
}

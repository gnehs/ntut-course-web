import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/ui-kit/Card.jsx'
import { CardTitle } from '../components/ui-kit/CardTitle.jsx'
import { Loader } from '../components/ui-kit/Loader.jsx'
import { Select } from '../components/ui-kit/Select.jsx'
import { fetchWithdrawal } from '../lib/courseApi.js'

export function WithdrawalPage() {
  const [period, setPeriod] = useState('-recent-3-years')
  const [data, setData] = useState(null)
  const [stat, setStat] = useState(null)
  const suffix = period === 'all' ? '' : period
  useEffect(() => {
    let cancelled = false
    setData(null)
    setStat(null)
    fetchWithdrawal(suffix).then((value) => {
      if (!cancelled) {
        setData(value.data || [])
        setStat(value.stat || [])
      }
    }).catch(() => {
      if (!cancelled) {
        setData([])
        setStat([])
      }
    })
    return () => { cancelled = true }
  }, [suffix])
  const rows = useMemo(() => data || [], [data])
  return (
    <div>
      <h1>退選率</h1>
      <p>這是期間中所有教師的退選率統計頁面</p>
      <div className="flex items-center justify-between gap-2">
        <div />
        <div className="flex items-center">
          <Select value={period} onChange={(event) => setPeriod(event.target.value)} className="max-w-[180px]">
            <option value="-recent-3-years">過去三年</option>
            <option value="-recent-5-years">過去五年</option>
            <option value="all">所有期間</option>
          </Select>
        </div>
      </div>
      {!data ? <Loader /> : (
        <>
          {stat ? (
            <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
              {Array.isArray(stat)
                ? stat.map((item, index) => <Card key={`${item.title}-${index}`}><CardTitle>{item.value}</CardTitle><p>{item.title}</p></Card>)
                : Object.entries(stat).map(([key, value]) => <Card key={key}><CardTitle>{value}</CardTitle><p>{key}</p></Card>)}
            </div>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((item) => (
              <Link
                to={`/teacher/${item.name}`}
                className="rounded-[5px] bg-[rgb(var(--vs-background))] p-4 text-[rgb(var(--vs-text))] no-underline shadow-[0_5px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))] transition-all duration-200 hover:-translate-y-1 hover:text-[rgb(var(--vs-text))] hover:shadow-[0_10px_20px_0_rgba(0,0,0,var(--vs-shadow-opacity,0.05))]"
                key={item.name}
              >
                <h2 className="m-0 text-base">{item.name}</h2>
                <div className="text-lg font-bold">{item.rate_percent ?? item.rate}%</div>
                <div className="text-xs opacity-80">{item.withdraw} 人退選 / {item.people} 人選課</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

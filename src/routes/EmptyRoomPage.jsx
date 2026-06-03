import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, CardTitle, Dialog, Loader } from '../components/UI.jsx'
import { useApp } from '../state/AppContext.jsx'

const timetableSlots = ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D']
const dateEng2zh = { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }

export function EmptyRoomPage() {
  const { dataset, getCourses } = useApp()
  const [courses, setCourses] = useState(null)
  const [onError, setOnError] = useState(null)
  const [todayDayOfWeek, setTodayDayOfWeek] = useState(Object.keys(dateEng2zh)[new Date().getDay()])
  const [emptyroomDetailDialog, setEmptyroomDetailDialog] = useState(false)
  const [emptyroomDetailData, setEmptyroomDetailData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setCourses(null)
    setOnError(null)
    Promise.all([
      getCourses({ department: '研究所(日間部、進修部、週末碩士班)' }),
      getCourses({ department: '進修部' }),
      getCourses({ department: 'main' }),
    ]).then((data) => {
      if (cancelled) return
      setCourses(data.flat())
    }).catch((error) => {
      if (!cancelled) {
        setOnError(error)
        setCourses([])
      }
    })
    return () => {
      cancelled = true
    }
  }, [dataset.year, dataset.sem, getCourses])

  const { categoryList, roomList } = useMemo(() => {
    const result = { categoryList: [], roomList: [] }
    if (!courses) return result

    const roomMap = new Map()
    const categorySet = new Set()

    for (const course of courses) {
      for (const classroom of course.classroom || []) {
        if (!classroom?.name) continue
        const category = classroom.name.match(/^(\D.)/)?.[1] || classroom.name.slice(0, 2)
        categorySet.add(category)
        if (!roomMap.has(classroom.name)) {
          roomMap.set(classroom.name, {
            name: classroom.name,
            category,
            timetable: [...timetableSlots],
            link: classroom.link || '',
          })
        }
      }
    }

    for (const course of courses) {
      for (const classroom of course.classroom || []) {
        const room = roomMap.get(classroom.name)
        if (!room) continue
        const occupiedSlots = course.time?.[todayDayOfWeek] || []
        room.timetable = room.timetable.filter((slot) => !occupiedSlots.includes(String(slot)))
        if (classroom.link) room.link = classroom.link
      }
    }

    result.categoryList = [...categorySet].sort()
    result.roomList = [...roomMap.values()].sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [courses, todayDayOfWeek])

  if (!courses) return <Loader />

  return (
    <div>
      {onError ? <Alert danger><strong>擷取資料時發生了錯誤</strong><br /><pre>{String(onError.message || onError || 'Error')}</pre></Alert> : null}
      <Alert>請注意，此功能僅能列出表定無課程進行的教室，教室可能因其他因素，致無法使用。</Alert>
      <h1>尋找空教室</h1>
      <div className="flex flex-wrap items-center justify-center gap-1 py-3">
        {Object.entries(dateEng2zh).map(([en, zh]) => (
          <Button key={en} active={todayDayOfWeek === en} className="m-0" onClick={() => setTodayDayOfWeek(en)}>
            {zh.slice(1)}
          </Button>
        ))}
      </div>
      <div className="space-y-4">
        {categoryList.map((category) => (
          <section key={category}>
            <h3>{category}</h3>
            <div className="cards" style={{ '--card-row': 2, '--card-row-sm': 1 }}>
              {roomList.filter((room) => room.category === category).map((room) => (
                <Card
                  key={room.name}
                  className="hoverable padding"
                  onClick={() => {
                    setEmptyroomDetailData(room)
                    setEmptyroomDetailDialog(true)
                  }}
                >
                  <CardTitle>{room.name}</CardTitle>
                  <div className="course-dots">
                    {timetableSlots.map((slot) => (
                      <div
                        key={slot}
                        className={`course-dot-item ${room.timetable.includes(slot) ? '' : 'active'}`}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Dialog
        open={emptyroomDetailDialog}
        title={emptyroomDetailData ? `「${emptyroomDetailData.name}」詳細上課資訊` : '詳細上課資訊'}
        onClose={() => setEmptyroomDetailDialog(false)}
        footer={emptyroomDetailData?.link ? (
          <Button as="a" href={`https://aps.ntut.edu.tw/course/tw/${emptyroomDetailData.link}`} target="_blank" rel="noreferrer" className="m-0">
            到北科課程網站查看
          </Button>
        ) : null}
      >
        {emptyroomDetailData ? (
          <div className="overflow-hidden rounded-[8px] border border-[rgba(var(--vs-text),0.1)]">
            {timetableSlots.map((slot, index) => (
              <div
                key={slot}
                className={`flex items-center justify-between gap-4 bg-[rgb(var(--vs-background))] px-3 py-2 ${index > 0 ? 'border-t border-[rgba(var(--vs-text),0.1)]' : ''}`}
              >
                <div>{slot} - {slotToTime(slot)}</div>
                <div>{emptyroomDetailData.timetable.includes(slot) ? '空堂' : '有課程進行'}</div>
              </div>
            ))}
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}

function slotToTime(slot) {
  const timetable = {
    '1': '8:10',
    '2': '9:10',
    '3': '10:10',
    '4': '11:10',
    N: '12:10',
    '5': '13:10',
    '6': '14:10',
    '7': '15:10',
    '8': '16:10',
    '9': '17:10',
    A: '18:30',
    B: '19:20',
    C: '20:20',
    D: '21:10',
  }
  return timetable[slot]
}

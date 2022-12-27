<template>
  <div>
    <h1>新增到行事曆</h1>
    <p>注意：如果你變更了課程，需要重新新增課程到行事曆！</p>
    <vs-alert color="danger" v-if="!courseData.length">
      <template #title>沒有課程資料</template>
      請先新增課程資料
    </vs-alert>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 0</span> 加入課程
    </h2>
    <p>
      請先將你本學期的課程新增到
      <strong>北科課程好朋友</strong>
    </p>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 1</span> 請選擇要加入的課程
    </h2>
    <div class="con-checkbox">
      <vs-checkbox
        :val="item"
        v-model="selectedCourse"
        v-for="(item, i) of courseData"
        :key="i">{{ item.name }}</vs-checkbox>
    </div>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 2</span> 新增專用行事曆
    </h2>
    <p>建議建立專用的行事曆，未來若需移除課程時僅需刪除該行事曆即可。</p>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 3</span> 填寫行程期間
    </h2>
    <p>請填寫開學日與最後一次上課的日期，以便設定重複行程終止日期。</p>
    <div class="cards">
      <card>
        <p>開學日</p>
        <vs-input v-model="start" type="date">
        </vs-input>
      </card>
      <card>
        <p>最後上課日</p>
        <vs-input v-model="until" type="date">
        </vs-input>
      </card>
    </div>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 4</span> 匯入至行事曆
    </h2>
    <p>輕觸「匯入」按鈕以繼續，匯入流程根據系統與提供商有所不同，請查詢行事曆提供商之說明來了解如何匯入。</p>
    <vs-button @click="addToCalendar" :disabled="!selectedCourse.length" color="primary">匯入</vs-button>
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
export default {
  head() {
    return {
      title: '新增到行事曆'
    }
  },
  data() {
    return {
      courseData: [],
      selectedCourse: [],
      timetable: {
        '1': {
          start: '8:10',
          end: '9:00'
        },
        '2': {
          start: '9:10',
          end: '10:00'
        },
        '3': {
          start: '10:10',
          end: '11:00'
        },
        '4': {
          start: '11:10',
          end: '12:00'
        },
        N: {
          start: '12:10',
          end: '13:00'
        },
        '5': {
          start: '13:10',
          end: '14:00'
        },
        '6': {
          start: '14:10',
          end: '15:00'
        },
        '7': {
          start: '15:10',
          end: '16:00'
        },
        '8': {
          start: '16:10',
          end: '17:00'
        },
        '9': {
          start: '17:10',
          end: '18:00'
        },
        A: {
          start: '18:30',
          end: '19:20'
        },
        B: {
          start: '19:20',
          end: '20:10'
        },
        C: {
          start: '20:20',
          end: '21:10'
        },
        D: {
          start: '21:10',
          end: '22:00'
        }
      },
      until: null
    }
  },
  async created() {

    let { year, sem } = this.$store.state
    year = parseInt(year) + 1911
    if (sem == '2')
      year += 1
    let until, start;
    if (sem == '1') {
      until = new Date(year + 1, 1 - 1, 30 + 1)
      start = new Date(year, 9 - 1, 1 + 1)
    }
    else {
      until = new Date(year, 6 - 1, 30 + 1)
      start = new Date(year, 2 - 1, 1 + 1)
    }
    if (year == '2023' && sem == '2') {
      start = new Date(year, 2 - 1, 20 + 1)
      until = new Date(2023, 6 - 1, 21 + 1)
    }

    this.until = until.toISOString().split('T')[0]
    this.start = start.toISOString().split('T')[0]

    await this.getMyCourse()

  },
  methods: {
    async getMyCourse() {
      let { year, sem, department } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      if (department != 'main') {
        myCourseKey += `-${department}`
      }
      let courseIds = JSON.parse(localStorage[myCourseKey] || '[]')
      let course = await this.$fetchCourse(year, sem, department)

      this.courseData = course
        .filter(x => courseIds.includes(x.id))
        .map(x => ({
          courseType: x.courseType,
          name: x.name.zh,
          description: x.description.zh,
          time: x.time,
          teacher: x.teacher.map(y => y.name)
            .join('、')
            .trimEllip(13),
          classroom: x.classroom
            .map(y => y.name)
            .join('、')
            .trimEllip(13),
          link: `https://ntut-course.gnehs.net/course/${year}/${sem}/${x.id}`,
        }))
      this.selectedCourse = JSON.parse(JSON.stringify(this.courseData))
    },
    addToCalendar() {
      try {
        window.gtag('event', 'download_calendar', {
          event_category: 'calendar',
          event_label: 'download_calendar',
          value: this.selectedCourse.length
        })
      } catch (e) { }
      let { year, sem } = this.$store.state
      year = parseInt(year) + 1911
      if (sem == '2')
        year += 1
      let until = this.until

      this.$ics.removeAllEvents()
      for (let item of this.selectedCourse) {
        for (let w of Object.keys(item.time)) {
          let time = item.time[w]
          if (time.length == 0) continue
          let startTime = this.timetable[time[0]].start
          let endTime = this.timetable[time[time.length - 1]].end

          const mon = new Date(this.start)
          mon.setDate(mon.getDate() + ((7 - mon.getDay()) % 7 + 1) % 7);

          // format: YYYYMMDDTHHMMSS
          // auto add zero padding
          let weekDays = {
            mon: mon,
            tue: new Date(mon.getTime() + 1000 * 60 * 60 * 24),
            wed: new Date(mon.getTime() + 1000 * 60 * 60 * 24 * 2),
            thu: new Date(mon.getTime() + 1000 * 60 * 60 * 24 * 3),
            fri: new Date(mon.getTime() + 1000 * 60 * 60 * 24 * 4),
            sat: new Date(mon.getTime() + 1000 * 60 * 60 * 24 * 5),
            sun: new Date(mon.getTime() + 1000 * 60 * 60 * 24 * 6)
          }



          let beginTime = new Date(
            year,
            weekDays[w].getMonth(),
            weekDays[w].getDate(),
            startTime.split(':')[0],
            startTime.split(':')[1]
          )
          let stopTime = new Date(
            year,
            weekDays[w].getMonth(),
            weekDays[w].getDate(),
            endTime.split(':')[0],
            endTime.split(':')[1]
          )
          // to ics time format
          let result = {
            language: 'zh-TW',
            subject: item.name,
            description: item.description,
            location: item.classroom,
            begin: beginTime.toISOString(),
            stop: stopTime.toISOString(),
            url: item.link,
            organizer: { name: '北科課程好朋友' },
            rrule: {
              freq: 'WEEKLY',
              until,
              interval: 1
            }
          }
          this.$ics.addEvent(result.language, result.subject, result.description, result.location, result.begin, result.stop, result.url, result.organizer, result.rrule)
        }
      }
      let { year: originalYear } = this.$store.state
      let cal = this.$ics.calendar()
      let name = `${originalYear} 學年度${sem == '1' ? '上' : '下'}學期課程`
      let description = `行事曆資訊由北科課程好朋友產生`
      cal = cal.replace('\nBEGIN:VCALENDAR', `BEGIN:VCALENDAR\nVERSION:2.0\nX-WR-CALNAME:${name}\nX-WR-CALDESC:${description}\nX-WR-TIMEZONE:Asia/Taipei`)
      let blob = new Blob([cal], { type: 'text/calendar;charset=utf-8' })
      saveAs(blob, `${originalYear}-${sem}-course.ics`);
    }
  }
}
</script>

<style lang="sass"  >
.con-checkbox
  flex-direction: column
  align-items: flex-start
</style>
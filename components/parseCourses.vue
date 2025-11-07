<template>
  <div v-if="courses">
    <div class="center">
      <vs-button flat :active="layout == 'table'" @click="layout = 'table'; trackBtn()">
        <i class="bx bx-table"></i>表格
      </vs-button>
      <vs-button flat :active="layout == 'card'" @click="layout = 'card'; trackBtn('toggle_card_view')">
        <i class="bx bx-card"></i>卡片
      </vs-button>
      <vs-button
        flat
        :active="layout == 'timetable'"
        @click="layout = 'timetable'; trackBtn('toggle_timetable_view')"
        v-if="showTimetable">
        <i class="bx bx-time"></i>課表
      </vs-button>
    </div>
    <div v-if="layout == 'card'">
      <transition-group name="flip-card" tag="div" class="grid-cards">
        <card
          class="hoverable padding"
          v-for="tr in $vs.getPage(filteredCourse, page, max)"
          :key="tr.id"
          :to="`/course/${$store.state.year}/${$store.state.sem}/${tr.id}`">
          <card-title space-between>
            <sports-title :course-data="tr" v-if="tr.class.some(x => x.name.match(/體育/))" />
            <span v-else>{{ tr.courseType }}{{ tr.name.zh }}</span>
            <tag v-if="conflictCourseData.includes(tr.id)" color="red">
              <i class="bx bxs-error"></i>衝堂
            </tag>
          </card-title>
          <general-tags :course-data="tr" />

          <div class="cards">
            <card class="borderless">
              <card-title>{{ tr.id }}</card-title>
              <p>課號</p>
            </card>
            <card class="borderless">
              <card-title>{{ tr.credit }}</card-title>
              <p>學分</p>
            </card>
            <card v-for="item in parseTime(tr.time)" :key="item.title" class="borderless">
              <card-title>{{ item.content }}</card-title>
              <p>{{ item.title }}</p>
            </card>
            <card v-if="!parseTime(tr.time).length" class="borderless">
              <card-title>無資料</card-title>
              <p>上課時間</p>
            </card>
          </div>
          <p>
            班級：{{
                tr.class
                  .map((x) => x.name)
                  .join('、')
                  .trimEllip(9)
            }}
            <br />
            教師：{{
                tr.teacher
                  .map((y) => y.name)
                  .join('、')
                  .trimEllip(13)
            }}
            <br />
            備註：{{ tr.notes.trimEllip(15) }}
          </p>
        </card>
      </transition-group>
      <div class="center">
        <p v-if="!courses.length">查無資料</p>
      </div>
      <br />
      <vs-pagination
        v-model="page"
        :length="$vs.getLength(filteredCourse, max)" />
    </div>
    <card style="padding: 0" v-if="layout == 'table'">
      <vs-table striped>
        <template #thead>
          <vs-tr>
            <vs-th>課號</vs-th>
            <vs-th>課程名稱</vs-th>
            <vs-th>教師</vs-th>
            <vs-th>班級</vs-th>
            <vs-th>備註</vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr
            :key="tr.id"
            v-for="tr in $vs.getPage(filteredCourse, page, max)"
            @click="$router.push(`/course/${$store.state.year}/${$store.state.sem}/${tr.id}`)"
            style="cursor: pointer"
            :data="tr">
            <vs-td>{{ tr.id }}</vs-td>
            <vs-td>{{ tr.courseType }}{{ tr.name.zh }}</vs-td>
            <vs-td>
              {{
                  tr.teacher
                    .map((y) => y.name)
                    .join('、')
                    .trimEllip(9)
              }}
            </vs-td>
            <vs-td>
              {{
                  tr.class
                    .map((x) => x.name)
                    .join('、')
                    .trimEllip(9)
              }}
            </vs-td>
            <vs-td>
              <span style="color: red" v-if="conflictCourseData.includes(tr.id)">衝堂</span>
              <span v-else>{{ tr.notes }}</span>
            </vs-td>
          </vs-tr>
        </template>
        <template #footer>
          <vs-pagination
            v-model="page"
            :length="$vs.getLength(filteredCourse, max)" />
        </template>
        <template #notFound>
          <p
            v-if="!filteredCourse.length">查無資料</p>
        </template>
      </vs-table>
    </card>
    <card style="padding: 0; overflow: hidden" v-if="layout == 'timetable'">
      <div class="grid-timetable"
        :style="{
          gridTemplateColumns: ['[🥞time]', 'auto', weekday.map(x => `[🥞${x}]`).join(' 1fr ') + '1fr', 'calc(var(--gap) / 2)', '[🥞end]'].join(' '),
          gridTemplateRows: ['weekday', ...timetable, 'end'].map(x => `[🥞${x}]`).join(' auto ')
        }">
        <!-- decoration -->
        <div class="decoration-item" style="
            grid-column-start: 🥞time;
            grid-column-end: 🥞end;
            grid-row-start: 🥞weekday;
        " />
        <div class="decoration-item" style="
            grid-column-start: 🥞time;
            grid-row-start: 🥞weekday;
            grid-row-end: 🥞end;
        " />
        <div class="decoration-border-item"
          v-for="date in timetable.slice(1)"
          :key="`decoration-${date}`"
          :style="`
            grid-column-start: 🥞一;
            grid-column-end: 🥞end;
            grid-row-start: 🥞${date};
            grid-row-end: 🥞${timetable[timetable.indexOf(date) + 1] || 'end'};
          `" />
        <!-- time -->
        <div
          class="time-item"
          v-for="time of timetable"
          :style="{
            'grid-column-start': `🥞time`,
            'grid-row-start': `🥞${time}`,
          }"
          :key="time">
          <div class="time-item-content">
            {{ time }}
          </div>
        </div>
        <!-- weekday -->
        <div
          class="weekday-item"
          v-for="item of weekday"
          :style="{
            'grid-column-start': `🥞${item}`,
            'grid-row-start': `🥞weekday`,
          }"
          :key="item">
          <div class="time-item-content">
            {{ item }}
          </div>
        </div>
        <!-- course -->
        <router-link
          class="course-item"
          :class="{ 'course-conflict': item.isConflict }"
          :style="{ ...parseCourseStyle(item) }"
          v-for="item in timetableCourse"
          :key="item.id"
          :to="`/course/${$store.state.year}/${$store.state.sem}/${item.id}`"
          :is="item.isConflict ? 'div' : 'router-link'">
          <div class="course-name" v-if="item.isConflict">
            含有多個課程
          </div>
          <div class="course-name" v-else>
            {{ item.name.zh }}
          </div>
          <div class="course-info" v-if="item.isConflict">無法顯示課程，請使用其他模式檢視</div>
          <div class="course-info" v-else>
            {{ item.teacher
                .map((y) => y.name)
                .join('、')
                .trimEllip(13)
            }}<br />
            {{ item.classroom
    .map((y) => y.name)
    .join('、')
    .trimEllip(13)
            }}
          </div>
        </router-link>
      </div>
    </card>
    <br />
    <br />
    <br />
  </div>
</template>
<script>
export default {
  name: 'parse-courses',
  props: {
    courses: {
      type: Array,
      default: null
    },
    showTimetable: {
      type: Boolean,
      default: false
    },
    showConflictCourse: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    layout: 'card',
    max: 54,
    page: 1,
    conflictCourseData: [],
    timetable: ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D'],
    dateEng2zh: { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }
  }),
  computed: {
    weekday() {
      let res = {
        sun: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false
      }
      for (let item of this.courses) {
        for (let date of Object.keys(res)) {
          if (item.time[date].length) {
            res[date] = true
          }
        }
      }
      res = Object.keys(res).filter((x) => res[x]).map((x) => this.dateEng2zh[x]).map(x => x.slice(1))
      return res
    },
    filteredCourse() {
      if (!this.courses) return []
      return this.showConflictCourse ? this.courses : this.courses.filter((x) => !this.conflictCourseData.includes(x.id))
    },
    timetableCourse() {
      let res = []
      // Group contiguous time slots
      const groupContiguous = (times) => {
        if (!times || !times.length) return []
        const order = this.timetable
        const sorted = [...times].sort((a, b) => order.indexOf(a) - order.indexOf(b))
        const groups = []
        let current = [sorted[0]]
        
        for (let i = 1; i < sorted.length; i++) {
          const prevIdx = order.indexOf(sorted[i - 1])
          const idx = order.indexOf(sorted[i])
          if (idx === prevIdx + 1) {
            current.push(sorted[i])
          } else {
            groups.push([...current])
            current = [sorted[i]]
          }
        }
        if (current.length) groups.push(current)
        return groups
      }

      function checkConflict(a, b) {
        for (let i of Object.entries(a.time)) {
          for (let j of i[1]) {
            if (b.time[i[0]].includes(j)) {
              console.log(a, b)
              return true
            }
          }
        }
        return false
      }
      // filter conflict
      let conflictTimetable = {
        sun: [],
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        sat: []
      }
      let courseData = this.filteredCourse
      for (let course of courseData) {
        for (let key of Object.keys(course.time)) {
          if (course.time[key].length) {
            let isConflict = courseData
              .filter(x => course.id != x.id)
              .some(x => checkConflict(course, x))
            if (isConflict) {
              conflictTimetable[key].push(course.time[key])
            } else {
              // Split non-contiguous time slots into groups
              const groups = groupContiguous(course.time[key])
              for (const group of groups) {
                res.push({
                  ...course,
                  date: key,
                  dateTime: group
                })
              }
            }
          }
        }
      }
      for (let key of Object.keys(conflictTimetable)) {
        conflictTimetable[key] = [...new Set(conflictTimetable[key].reduce((a, b) => a.concat(b), []))]
      }
      Object.entries(conflictTimetable).forEach(([key, times]) => {
        if (times.length) {
          const groups = groupContiguous(times)
          groups.forEach((group, i) => {
            res.push({
              id: `conflict-${key}-${i}`,
              date: key,
              dateTime: group,
              isConflict: true
            })
          })
          console.log(res)
        }
      })
      return res
    }
  },
  mounted() {
    this.checkIsCourseConflict()
    if (this.$route.query.layout) this.layout = this.$route.query.layout
    if (this.$route.query.page) this.page = this.$route.query.page
  },
  watch: {
    courses(newCount, oldCount) {
      this.checkIsCourseConflict()
    },
    page(newPage, oldPage) {
      let query = Object.assign({}, this.$route.query)
      query.page = newPage
      this.$router.replace({ query }, () => { })
    },
    layout(newLayout, oldLayout) {
      let query = Object.assign({}, this.$route.query)
      query.layout = newLayout
      this.$router.replace({ query }, () => { })
    }
  },
  methods: {
    trackBtn(e = 'toggle_table_view') {
      try {
        window.gtag('event', e)
      } catch (e) { }
    },
    parseTime(t) {
      let result = []
      for (let [day, times] of Object.entries(t)) {
        if (times.length) {
          const sortedTimes = [...times].sort((a, b) => {
            if (a === 'N') return -1
            if (b === 'N') return 1
            return a.localeCompare(b)
          })

          const mergedTimes = []
          let start = sortedTimes[0]
          let prev = start

          for (let i = 1; i <= sortedTimes.length; i++) {
            const current = sortedTimes[i]
            
            if (i === sortedTimes.length || 
                current === 'N' || 
                prev === 'N' || 
                parseInt(current) !== parseInt(prev) + 1) {
              
              if (start === 'N' || start === prev) {
                mergedTimes.push(start)
              } else {
                mergedTimes.push(`${start}~${prev}`)
              }
              
              if (i < sortedTimes.length) {
                start = current
              }
            }
            prev = current
          }
          
          result.push({
            title: this.dateEng2zh[day],
            content: mergedTimes.join('、')
          })
        }
      }
      return result
    },
    async checkIsCourseConflict() {
      this.conflictCourseData = await this.$checkConflictedCourse(this.courses)
      let length = this.$vs.getLength(
        this.showConflictCourse ? this.courses : this.courses.filter(x => !this.conflictCourseData.includes(x.id)),
        this.max
      )
      if (this.page > length) this.page = 1
    },
    parseCourseStyle(item) {
      const first = item.dateTime[0]
      const last = item.dateTime[item.dateTime.length - 1]
      const start = `🥞${first}`
      const end = `🥞${this.timetable[this.timetable.indexOf(last) + 1] || 'end'}`
      const date = `🥞${this.dateEng2zh[item.date].slice(1)}`
      
      return {
        'grid-column-start': date,
        'grid-row': `${start} / ${end}`,
      }

    }
  }
}
</script>
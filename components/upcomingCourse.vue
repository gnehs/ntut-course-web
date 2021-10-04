<template>
  <div v-if="upcomingCourse.length">
    <h2>接下來的課程</h2>
    <transition-group name="flip-card" tag="div" class="cards">
      <card
        class="hoverable padding"
        v-for="tr in upcomingCourse"
        :key="tr.id"
        :to="`/course/${$store.state.year}/${$store.state.sem}/${tr.id}`"
        style="--card-row: 3; --card-row-sm: 1"
      >
        <card-title>
          {{ tr.name.zh }}
          <tag color="#f0f2f5" text-color="#606770" v-if="tr.classroom.length">
            {{
              tr.classroom
                .map((y) => y.name)
                .join('、')
                .trimEllip(13)
            }}
          </tag>
        </card-title>
        <p>於 {{ timetable[tr.time[todayDayOfWeek][0]] }} 開始，共 {{ tr.time[todayDayOfWeek].length }} 節</p>
      </card>
    </transition-group>
  </div>
</template>

<script>
export default {
  data() {
    return {
      timetable: {
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
        D: '21:10'
      },
      dateEng2zh: { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' },
      todayDayOfWeek: '',
      myCourses: [],
      upcomingCourse: []
    }
  },
  computed: {
    year() {
      return this.$store.state.year
    },
    sem() {
      return this.$store.state.sem
    }
  },
  watch: {
    year(newCount, oldCount) {
      this.getUpcomingCourse()
    },
    sem(newCount, oldCount) {
      this.getUpcomingCourse()
    }
  },
  async created() {
    this.getUpcomingCourse()
  },
  methods: {
    parseTime(t) {
      let result = []
      for (let i of Object.entries(t)) {
        if (i[1].length) result.push({ title: this.dateEng2zh[i[0]], content: i[1].join('、') })
      }
      return result
    },
    async getUpcomingCourse() {
      let currentDate = new Date()
      // get my-courses
      let { year, sem, department } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      if (department != 'main') {
        myCourseKey += `-${department}`
      }
      let courseIds = JSON.parse(localStorage[myCourseKey] || '[]')
      let course = await this.$fetchCourse(year, sem, department)
      this.myCourses = course.filter(x => courseIds.includes(x.id))
      // show upcoming course
      let upcomingCourseIncludes = Object.entries(this.timetable)
        .filter(([courseId, courseTime]) => {
          let tempDate = new Date()
          tempDate.setHours(courseTime.split(':')[0], courseTime.split(':')[1], 0)
          return tempDate > currentDate
        })
        .map(x => x[0])
      let todayDayOfWeek = Object.keys(this.dateEng2zh)[currentDate.getDay()]
      this.todayDayOfWeek = todayDayOfWeek
      this.upcomingCourse = this.myCourses.filter(x => x.time[todayDayOfWeek].some(r => upcomingCourseIncludes.includes(r)))
    }
  }
}
</script>

<style>
</style>
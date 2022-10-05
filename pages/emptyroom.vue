<template>
  <div>
    <vs-alert>請注意，此功能僅能列出表定無課程進行的教室，教室可能因其他因素，致無法使用。</vs-alert>
    <h1>尋找空教室</h1>
    <div class="center">
      <vs-button
        flat
        :active="todayDayOfWeek == en"
        @click="todayDayOfWeek = en"
        v-for="[en,zh] of Object.entries(dateEng2zh)"
        :key="en">
        {{ zh.slice(1) }}
      </vs-button>
    </div>
    <div v-if="categoryList">
      <template v-for="category of categoryList">
        <h3 :key="category">{{ category }}</h3>
        <div class="cards" :key="category + '_classroom'" style="--card-row: 2; --card-row-sm: 1">
          <card
            class="hoverable padding"
            v-for="classroom of classList.filter((x) => x.category == category)"
            :key="classroom.name"
            @click.native="showEmptyroomDetailDialog(classroom)">
            <card-title>{{ classroom.name }}</card-title>
            <div class="course-dots">
              <div
                class="course-dot-item"
                v-for="i of upcomingCourseIncludes"
                :key="i"
                :class="{ active: !classroom.timetable.includes(i) }">{{ i }}</div>
            </div>
          </card>
        </div>
      </template>
    </div>
    <vs-dialog v-model="emptyroomDetailDialog">
      <template #header>
        <h4>
          <span v-if="emptyroomDetailData">「{{ emptyroomDetailData.name }}」</span>詳細上課資訊
        </h4>
      </template>

      <div class="list" v-if="emptyroomDetailData">
        <div
          class="item"
          style="display: flex; justify-content: space-between; flex-direction: row"
          v-for="item of upcomingCourseIncludes"
          :key="item">
          <div>{{ item }} - {{ timetable[item] }}</div>
          <div>{{ emptyroomDetailData.timetable.includes(item) ? '空堂' : '有課程進行' }}</div>
        </div>
        <a
          class="item"
          style="display: block; text-align: center"
          v-if="emptyroomDetailData"
          :href="`https://aps.ntut.edu.tw/course/tw/${emptyroomDetailData.link}`"
          target="_blank">到北科課程網站查看</a>
      </div>
    </vs-dialog>
  </div>
</template>
<style lang="sass" scoped>

.course-dots
  display: flex
  gap: 0.25rem
  margin-top: 0.5rem
  flex-wrap: wrap
  .course-dot-item
    width: 1.25rem
    height: 1.25rem
    display: flex
    justify-content: center
    align-items: center
    border-radius: 50%
    background-color: rgba(0,0,0,.1)
    font-size: 0.75rem
    font-family: 'Lato', sans-serif
    &.active
      background-color: red
      color: white
</style>
<script>
export default {
  data: () => ({
    onError: null,
    categoryList: [],
    classList: [],
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
    upcomingCourseIncludes: [],
    emptyroomDetailDialog: false,
    emptyroomDetailData: null,
    todayDayOfWeek: null
  }),
  head() {
    return {
      title: '尋找空教室'
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
      this.getEmptyClass()
    },
    sem(newCount, oldCount) {
      this.getEmptyClass()
    },
    todayDayOfWeek(newCount, oldCount) {
      this.getEmptyClass()
    }
  },
  created() {
    this.getEmptyClass()
  },
  methods: {
    showEmptyroomDetailDialog(data) {
      this.emptyroomDetailData = data
      this.emptyroomDetailDialog = true
    },
    async getEmptyClass() {
      let { year, sem } = this.$store.state
      let course = [
        ...(await this.$fetchCourse(year, sem, '研究所(日間部、進修部、週末碩士班)')),
        ...(await this.$fetchCourse(year, sem, '進修部')),
        ...(await this.$fetchCourse(year, sem, 'main'))
      ]
      // get empty class
      let currentDate = new Date()
      let timetable = {
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
      }
      let upcomingCourseIncludes = Object.keys(timetable)
      this.upcomingCourseIncludes = upcomingCourseIncludes
      // create class list
      let classList = new Set()
      let categoryList = new Set()
      course.map(x => {
        x.classroom.map(y => {
          classList.add(y.name)
        })
      })
      classList = Array.from(classList).map(x => {
        let category = x.match(/^(\D.)/)[1]
        categoryList.add(category)
        return {
          name: x,
          category,
          timetable: upcomingCourseIncludes
        }
      })

      let dateEng2zh = { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }
      let todayDayOfWeek = this.todayDayOfWeek || Object.keys(dateEng2zh)[currentDate.getDay()]
      this.todayDayOfWeek = todayDayOfWeek
      course
        .filter(x => x.classroom.length)
        .map(x => {
          x.classroom.map(y => {
            // remove from classList timetable
            classList.map(z => {
              if (z.name == y.name) {
                z.timetable = z.timetable.filter(i => !x.time[todayDayOfWeek].includes(i))
                z.link = y.link
              }
            })
          })
        })
      classList = classList.sort((a, b) => a.name.localeCompare(b.name))
      this.classList = classList
      this.categoryList = Array.from(categoryList).sort()
    }
  }
}
</script>
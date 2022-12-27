<template>
  <div>
    <h1 style="margin-bottom: 12px;">{{ name }}</h1>
    <vs-alert v-show="onError">
      <template #title>擷取資料時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>
    <loader v-if="!teacher && !onError" />
    <div class="cards" style="--card-row: 6; --card-row-sm: 3" v-if="teacher">
      <card>
        <card-title>{{ teacher.withdraw }}</card-title>
        <p>退選人數</p>
      </card>
      <card>
        <card-title>{{ teacher.people }}</card-title>
        <p>選課人數</p>
      </card>
      <card>
        <card-title>{{ teacher.course.length }}</card-title>
        <p>課程數</p>
      </card>
      <card v-for="item of stats" :key="item.name">
        <card-title>{{ item.value }}%</card-title>
        <p>{{ item.name }}</p>
      </card>
    </div>
    <div class="lr-container" v-if="teacher">
      <div class="l" style="display:block;">
        <h3 v-if="teacher">課程</h3>
      </div>
      <div class="r">
        <vs-button
          flat
          :active="selectedDepartment == 'main'"
          @click="selectedDepartment = 'main'">
          日間部
        </vs-button>
        <vs-button
          flat
          :active="selectedDepartment == '進修部'"
          @click="selectedDepartment = '進修部'">
          進修部
        </vs-button>
        <vs-button
          flat
          :active="selectedDepartment == '研究所(日間部、進修部、週末碩士班)'"
          @click="selectedDepartment = '研究所(日間部、進修部、週末碩士班)'">
          研究所
        </vs-button>
      </div>
    </div>
    <div class="course-items" v-if="courses">
      <div class="course-item" v-for="course of courses" :key="course.id"
        @click="$router.push(`/course/${course.year}/${course.sem}/${course.id}`)">
        <div class="info">
          <div class="id">{{ course.id }} </div>
          <div class="year-sem">{{ course.year }} 年{{ course.sem == '1' ? '上' : '下' }}學期</div>
        </div>
        <div class="title">
          <div class="zh">{{ course.courseType }} {{ course.name.zh }}</div>
          <div class="en"> {{ course.name.en }}</div>
        </div>

        <div class="withdraw">
          <div class="value">
            {{ course.peopleWithdraw }}
          </div>
          <div class="name">退選</div>
        </div>
        <div class="people">
          <div class="value">
            {{ course.people }}
          </div>
          <div class="name">選課</div>
        </div>
      </div>
    </div>
    <div v-if="courses && !courses.length">
      <p>尚無課程，請選擇其他分類</p>
    </div>
    <h3>贊助商廣告</h3>
    <adsbygoogle />
  </div>
</template>

<script>
export default {
  computed: {
    name() {
      return this.$route.params.id
    },
  },
  head() {
    return {
      title: this.name
    }
  },
  data() {
    return {
      teacher: null,
      courses: null,
      isCourseFiltered: false,
      stats: [],
      onError: null,
      selectedDepartment: localStorage.getItem('data-department') || 'main',
    }
  },
  watch: {
    selectedDepartment() {
      localStorage.setItem('data-department', this.selectedDepartment)
      this.filterCourse()
    }
  },
  mounted() {
    this.getTeacher()
  },
  methods: {
    async getTeacher() {
      let withdrawalRateData = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal-rate.json`)
        .then(res => res.json())
      let withdrawalRateData_3y = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal-rate-recent-3-years.json`)
        .then(res => res.json())
      let withdrawalRateData_5y = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal-rate-recent-5-years.json`)
        .then(res => res.json())
      let withdrawalData = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal.json`)
        .then(res => res.json())
      if (!withdrawalRateData[this.name]) {
        this.onError = '找不到教師'
        return
      }
      this.teacher = withdrawalData.data.filter(x => x.name === this.name)[0]
      this.filterCourse()
      if (this.courses.length != this.teacher.course.length) {
        this.isCourseFiltered = true
      }
      this.stats = [
        {
          name: `近三年退選率`,
          value: withdrawalRateData_3y[this.name] ?? `無資料`,
        },
        {
          name: `近五年退選率`,
          value: withdrawalRateData_5y[this.name] ?? `無資料`,
        },
        {
          name: `全期間退選率`,
          value: withdrawalRateData[this.name],
        }
      ]
    },
    filterCourse() {
      this.courses = this.teacher.course.filter(x => x.department === this.selectedDepartment)
    }
  },
}
</script>

<style lang="sass" scoped>

.course-items
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 12px
  margin-top: 8px
  @media (max-width: 768px)
    grid-template-columns: 1fr
  .course-item
    display: grid
    grid-template-areas: "info title withdraw people"
    grid-template-columns: auto 1fr auto auto
    align-items: center
    gap: 0 8px
    padding: 8px
    box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
    border-radius: 8px
    transition: all .25s ease
    background: rgba(var(--vs-background),1)
    &:hover
      cursor: pointer
      box-shadow: 0 10px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
      transform: translate(0, -5px)
      color: var(--vs-text)
    &:active
      box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, var(--vs-shadow-opacity,0))
      transform: translate(0, 5px)
    .info
      grid-area: info
      .id
        font-size: 16px
        font-weight: bold
      .year-sem
        font-size: 12px
        opacity: .8
    .title
      grid-area: title
      .zh
        font-weight: bold
        font-size: 16px
      .en
        font-size: 12px
        opacity: .8
    .people
      grid-area: people
    .withdraw
      grid-area: withdraw
    .withdraw, .people
      display: flex
      align-items: center
      justify-content: center
      flex-direction: column
      .value
        font-weight: bold
        font-size: 16px
      .name
        font-size: 12px
        opacity: .8
</style>
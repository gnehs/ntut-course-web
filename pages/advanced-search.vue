<template>
  <div class="advanced-search">
    <div class="search-sidebar-backdrop" :class="{ 'open': sidebarOpen }" @click="sidebarOpen = !sidebarOpen" />
    <div class="search-sidebar" :class="{ 'open': sidebarOpen }">
      <div class="logo" style="margin-bottom: 8px">
        <router-link to="/" class="site-title">🍤 北科課程好朋友</router-link>
        <div style="display: flex;gap: 4px;align-items: center;">
          <vs-button flat :active="false" @click="reset">重設</vs-button>
          <vs-button icon class="sidebar-toggle" :active="!sidebarOpen" @click="sidebarOpen = !sidebarOpen">
            <i class='bx bx-x'></i>
          </vs-button>
        </div>
      </div>
      <N-Input label="關鍵字" v-model="searchCourseKeyword" placeholder="課程名稱、教師、課號、班級" />
      <div class="recommand-keyword">
        <span>建議：</span>
        <vs-button flat
          @click="searchCourseKeyword = keyword"
          v-for="keyword of recommandKeyword"
          :active="searchCourseKeyword == keyword"
          :key="keyword" size="small">
          {{ keyword }}
        </vs-button>
      </div>
      <search-detail style="margin-top: 8px">
        <template #header>顯示與排序</template>
        <template #body>
          <vs-checkbox v-model="showConflictCourse">顯示衝堂課程</vs-checkbox>
          <vs-tooltip bottom>
            <vs-checkbox v-model="showPlaceholder">顯示佔位課程</vs-checkbox>
            <template #tooltip>
              <div style="text-align: left;">
                開啟此選項將會顯示佔位課程，像是學院指定向度、學生自選向度等等。
              </div>
            </template>
          </vs-tooltip>
          <br />
          <vs-select
            label="排序依照"
            v-model="sortBy">
            <vs-option label="預設" value="default">
              預設
            </vs-option>
            <vs-option label="退選率（由低到高）" value="withdrawal">
              退選率（由低到高）
            </vs-option>
          </vs-select>
        </template>
      </search-detail>
      <search-detail :enabled="courseStandardFilterEnabled">
        <template #header>依課程標準篩選</template>
        <template #body>
          <vs-checkbox v-model="courseStandardFilter[symbol]" v-for="[symbol, text] of Object.entries(courseStandard)" :key="text">
            {{ symbol }} {{ text }}
          </vs-checkbox>
        </template>
      </search-detail>
      <search-detail :enabled="categoryFilter.length">
        <template #header>依博雅類別篩選課程</template>
        <template #body>
          <vs-checkbox :val="val" v-model="categoryFilter" v-for="[key, val] of Object.entries(categoryFilterList)" :key="val">
            {{ key }}
          </vs-checkbox>
        </template>
      </search-detail>
      <search-detail :enabled="academyFilter.length != academyList.length">
        <template #header>依學院篩選</template>
        <template #body>
          <vs-checkbox :val="val" v-model="academyFilter" v-for="val of academyList" :key="val">
            {{ val }}
          </vs-checkbox>
        </template>
      </search-detail>
      <search-detail :enabled="Object.values(timetableFilter).some(x => x.length)">
        <template #header>依時間篩選</template>
        <template #body>
          <p>
            Tips: 點擊課表上的星期或節次來一次選取整個行或列，點擊左上角可以一次選取整個課表。
          </p>
          <div class="timetable" style="margin: 0 -16px;">
            <div class="header">
              <div class="item" @click="toggleLesson()"></div>
              <div class="item" @click="toggleLesson('mon')">一</div>
              <div class="item" @click="toggleLesson('tue')">二</div>
              <div class="item" @click="toggleLesson('wed')">三</div>
              <div class="item" @click="toggleLesson('thu')">四</div>
              <div class="item" @click="toggleLesson('fri')">五</div>
            </div>
            <div class="content" v-for="time in timetable" :key="time">
              <div class="item" @click="toggleLesson(null, time)">{{ time }}</div>
              <div class="item" v-for="date in Object.keys(dateEng2zh).slice(1, 5 + 1)" :key="date">
                <div
                  class="course"
                  @click="toggleLesson(date, time)"
                  :class="{ conflict: timetableFilter[date].includes(time) }"
                  style="justify-content: center; font-size: 2em; padding: 4px 6px">
                  <i class="bx bx-check" v-if="!timetableFilter[date].includes(time)" />
                  <i class="bx bx-x" v-else />
                </div>
              </div>
            </div>
          </div>
        </template>
      </search-detail>
    </div>
    <div class="search-result">
      <div class="search-result-header">
        <h2>進階搜尋</h2>
        <vs-button
          class="sidebar-toggle"
          :active="sidebarOpen"
          @click="sidebarOpen = !sidebarOpen">
          <i class='bx bx-search' style="margin-right: 4px;"></i>
          搜尋
        </vs-button>
      </div>
      <p class="sidebar-toggle" style="opacity: .75;"><strong>第一次來嗎？</strong>使用右上角按鈕進行搜尋</p>
      <loader v-if="searchResult === null" />
      <parse-courses v-if="searchResult" :courses="searchResult" :show-conflict-course="showConflictCourse" />
      <p style="text-align: center;font-size: .75em;opacity: .75;">
        <router-link :to="`/search?year=${$store.state.year}&sem=${$store.state.sem}&d=${$store.state.department}`"> 回到舊版搜尋</router-link>
      </p>
    </div>
  </div>
</template>
<script>
import pako from 'pako'
export default {
  head() {
    return {
      title: '進階搜尋',
    }
  },
  data() {
    return {
      // data
      withdrawalRate: null,
      departmentData: null,
      recommandKeyword: ['體育', '博雅'],
      // page state
      sidebarOpen: false,
      searchCourseKeyword: '',
      searchResult: null,
      // sort
      sortBy: 'default',
      // filter
      showConflictCourse: true,
      showPlaceholder: false,
      // 博雅
      categoryFilter: [],
      categoryFilterList: {
        '創新與創業': `創創`,
        '人文與藝術': `人文與藝術`,
        '社會與法治': `社會與法治`,
        '自然向度': `自然`,
      },
      // 課程標準
      courseStandard: {
        '○': '部訂共同必修',
        '△': '校訂共同必修',
        '☆': '共同選修',
        '●': '部訂專業必修',
        '▲': '校訂專業必修',
        '★': '專業選修'
      },
      courseStandardFilter: {
        '○': true,
        '△': true,
        '☆': true,
        '●': true,
        '▲': true,
        '★': true
      },
      // 學院
      academyList: [],
      academyFilter: [],
      // 課表
      timetable: ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C'],
      dateEng2zh: { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' },
      timetableFilter: {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: []
      },
    }
  },
  computed: {
    courseStandardFilterEnabled() {
      return Object.values(this.courseStandardFilter).some(x => !x)
    },
  },
  watch: {
    showPlaceholder() { this.searchCourse() },
    searchCourseKeyword() { this.searchCourse() },
    sortBy() { this.searchCourse() },
    categoryFilter: { handler() { this.searchCourse() }, deep: true },
    courseStandardFilter: { handler() { this.searchCourse() }, deep: true },
    timetableFilter: { handler() { this.searchCourse() }, deep: true },
    academyFilter: { handler() { this.searchCourse() }, deep: true },
  },
  mounted() {
    // restore from query
    if (this.$route.query?.q) {
      let q = this.$route.query.q
      q = new Uint8Array(q.split(','))
      q = pako.inflate(q, { level: 6 })
      q = JSON.parse(new TextDecoder("utf-8").decode(q))

      if (q.searchCourseKeyword) this.searchCourseKeyword = q.searchCourseKeyword
      if (q.showConflictCourse) this.showConflictCourse = q.showConflictCourse
      if (q.categoryFilter) this.categoryFilter = q.categoryFilter
      if (q.courseStandardFilter) this.courseStandardFilter = q.courseStandardFilter
      if (q.academyFilter) this.academyFilter = q.academyFilter
      if (q.timetableFilter) this.timetableFilter = q.timetableFilter
      if (q.sortBy) this.sortBy = q.sortBy
      if (q.showPlaceholder) this.showPlaceholder = q.showPlaceholder
    }
    // get data
    this.fetchDepartmentData()
    this.searchCourse()
    this.getWithdrawalRate()

  },
  methods: {
    async getWithdrawalRate() {
      if (!this.withdrawalRate) {
        let res = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal-rate.json`)
          .then(x => x.json())
        this.withdrawalRate = res
      }
    },
    async fetchCourseData() {
      let { year, sem, d } = this.$route.query
      return (await this.$fetchCourse(year, sem, d))
    },
    async fetchDepartmentData() {
      if (!this.departmentData) {
        let { year, sem } = this.$route.query
        let res = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/${year}/${sem}/department.json`)
          .then(x => x.json())
        this.departmentData = res
        // update academyList
        let categoryList = [...new Set(res.map(x => x.category))]
        this.academyList = categoryList
        this.academyFilter = this.academyFilter.length ? this.academyFilter : structuredClone(this.academyList)
        // update keyword
        let classID = localStorage[`my-class`]
        let className = res.map(x => x.class).flat().filter(x => x.id == classID)[0]?.name
        if (className) {
          !this.recommandKeyword.includes(className) && this.recommandKeyword.push(className)
        }
      }
    },
    async searchCourse() {
      await this.fetchDepartmentData()
      let result = await this.fetchCourseData()
      // 關鍵字 searchCourseKeyword
      if (this.searchCourseKeyword.length) {
        if (!isNaN(this.searchCourseKeyword) && this.searchCourseKeyword.length >= 3) {
          // 課號
          result = result.filter(course => course.id.includes(this.searchCourseKeyword))
        } else {
          // 關鍵字：名稱、教師、班級
          for (let keyword of this.searchCourseKeyword.split(' ').map(x => x.toLowerCase())) {
            result = result.filter(course =>
              course.name?.zh.toLowerCase().includes(keyword) ||
              course.name?.en.toLowerCase().includes(keyword) ||
              course.teacher.map(x => x.name).join(' ').toLowerCase().includes(keyword) ||
              course.class.map(x => x.name).join(' ').toLowerCase().includes(keyword)
            )
            if (keyword == '體育') {
              result = result.filter(course => course.class.map(x => x.name).join(' ').toLowerCase().includes(keyword))
            }
          }
        }
      }
      // 課程標準 courseStandardFilter
      if (this.courseStandardFilterEnabled) {
        let standardList = Object.keys(this.courseStandardFilter).filter(x => this.courseStandardFilter[x])
        result = result.filter(x => standardList.includes(x.courseType))
      }
      // 博雅 categoryFilter
      if (this.categoryFilter.length) {
        result = result.filter(x => x.class.map(y => y.name).join('').includes('博雅') && this.categoryFilter.some(y => x.notes.includes(y)))
      }
      // 課表 timetableFilter
      result = result.filter(x => {
        for (let date of Object.keys(this.timetableFilter)) {
          for (let time of this.timetable) {
            if (this.timetableFilter[date].includes(time) && x.time[date].includes(time)) {
              return false
            }
          }
        }
        return true
      })
      // 學院 academyFilter
      if (this.academyFilter.length != this.academyList.length) {
        let filterOutAcademy = this.academyList.filter(x => !this.academyFilter.includes(x))
        let filterOutClass = this.departmentData.filter(x => filterOutAcademy.includes(x.category)).map(x => x.class).flat().map(x => x.name)
        result = result.filter(course => !course.class.map(x => x.name).some(x => filterOutClass.includes(x)))
      }
      if (this.sortBy === 'withdrawal') {
        await this.getWithdrawalRate()
        result = result.map(x => {
          x.withdrawalRate = Math.max(...x.teacher.map(x => x.name).map(x => this.withdrawalRate[x] || 0).filter(x => x), 0)
          return x
        })
        result.sort((a, b) => a.withdrawalRate - b.withdrawalRate)
      }
      if (!this.showPlaceholder) {
        result = result.filter(x => {
          if (x.name?.zh.includes('學院指定向度'))
            return false
          if (x.name?.zh.includes('學生自選向度'))
            return false
          if (x.name?.zh.includes('多元英文'))
            return false
          if (x.name?.zh.includes('體育') && !x.teacher.length)
            return false
          return true
        })
      }
      this.searchResult = result
      // set query
      let { year, sem, d } = this.$route.query
      let q = JSON.stringify({
        searchCourseKeyword: this.searchCourseKeyword,
        showConflictCourse: this.showConflictCourse,
        categoryFilter: this.categoryFilter,
        courseStandardFilter: this.courseStandardFilter,
        academyFilter: this.academyFilter,
        timetableFilter: this.timetableFilter,
        sortBy: this.sortBy,
        showPlaceholder: this.showPlaceholder
      })
      q = new TextEncoder().encode(q);
      q = pako.deflate(q, { level: 6 })
      this.$router.replace({
        query: {
          year,
          sem,
          d,
          q,
          t: new Date().getTime().toString().slice(-4)
        }
      })
    },
    reset() {
      this.searchCourseKeyword = ''
      this.showConflictCourse = true
      this.categoryFilter = []
      this.courseStandardFilter = {
        '○': true,
        '△': true,
        '☆': true,
        '●': true,
        '▲': true,
        '★': true
      }
      this.academyFilter = structuredClone(this.academyList)
      this.timetableFilter = {
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: []
      }
    },
    toggleLesson(date, time) {
      if (date && time) {
        if (this.timetableFilter[date].includes(time)) {
          this.timetableFilter[date] = this.timetableFilter[date].filter(x => x != time)
        } else {
          this.timetableFilter[date].push(time)
        }
      }
      if (date && !time) {
        if (this.timetableFilter[date].length) {
          this.timetableFilter[date] = []
        } else {
          this.timetableFilter[date] = this.timetable
        }
      }
      if (!date && time) {
        //check length
        let checkBlocks = 0
        for (let key of Object.keys(this.timetableFilter)) {
          checkBlocks += this.timetableFilter[key].includes(time) ? 1 : 0
        }
        for (let key of Object.keys(this.timetableFilter)) {
          if (checkBlocks) {
            this.timetableFilter[key] = this.timetableFilter[key].filter(x => x != time)
          } else {
            this.timetableFilter[key].push(time)
          }
        }
      }
      if (!date && !time) {
        //check length
        let checkBlocks = 0
        for (let key of Object.keys(this.timetableFilter)) {
          checkBlocks += this.timetableFilter[key].length
        }

        for (let key of Object.keys(this.timetableFilter)) {
          if (checkBlocks) {
            this.timetableFilter[key] = []
          } else {
            this.timetableFilter[key] = this.timetable
          }
        }
      }
    }
  },
}
</script>
<style lang="sass" scoped>
.advanced-search
  display: grid
  grid-template-columns: 350px 1fr
  height: 100vh
  height: 100svh
  .search-sidebar,.search-result
    height: 100vh
    height: 100svh
    overflow-y: auto
  .search-sidebar
    padding: 0px 16px
    background: rgba(var(--vs-background),1)
    box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
    .logo
      display: flex
      justify-content: space-between
      align-items: center
    .recommand-keyword
      display: flex
      flex-wrap: wrap
      align-items: center
      font-size: 12px
  .search-result
    padding: 8px 16px
    .search-result-header
      display: flex
      gap: 8px
      align-items: center
      justify-content: space-between
@media screen and (max-width: 768px)
  .search-sidebar-backdrop
    position: fixed
    top: 0
    left: 0
    right: 0
    bottom: 0
    z-index: 2
    background: rgba(0,0,0,.5)
    transition: opacity .3s ease
    cursor: pointer
    &.open
      background: rgba(0,0,0,.5)
    &:not(.open)
      opacity: 0
      pointer-events: none

  .search-result-header
    h2
      margin: 0
  .advanced-search
    display: block
    position: relative
    height: initial
    .search-sidebar
      position: fixed
      top: 0
      left: 0
      bottom: 0
      width: calc(100vw - 40px)
      max-width: 400px
      z-index: 999
      transition: transform .3s ease
      padding-top: 56px
      &:not(.open)
        transform: translateX(-100%)
      .logo a
        opacity: 0
        pointer-events: none
    .search-result
      overflow-y: initial
      height: initial
      padding: 0
@media screen and (min-width: 769px)
  .search-sidebar-backdrop
    display: none
  .sidebar-toggle
    display: none
</style>
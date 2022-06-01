<template>
  <div id="app">
    <vs-navbar center-collapsed v-model="active" shadow fixed not-line>
      <template #left>
        <router-link to="/" class="site-title">🍤 北科課程好朋友</router-link>
      </template>
      <vs-navbar-item :active="active == '/'" to="/">首頁</vs-navbar-item>
      <vs-navbar-item
        :active="active == '/search'"
        :to="`/search?year=${$store.state.year}&sem=${$store.state.sem}`"
        id="search">搜尋</vs-navbar-item>
      <template #right>
        <vs-button
          @click="datasetDialog = true"
          :disabled="Boolean($route.query.year)">{{ parseYearSemVal(yearSemVal) }}</vs-button>
      </template>
    </vs-navbar>
    <div class="container">
      <Nuxt />
    </div>
    <footer id="footer">
      <div class="lr-container nowrap">
        <div class="l">
          Developed by
          <a href="https://gnehs.net" target="_blank" style="margin-left: 0.2em">勝勝</a>
        </div>
        <div class="r">
          <vs-button icon transparent href="https://github.com/gnehs/ntut-course-web" blank>
            <i class="bx bxl-github"></i>
          </vs-button>
        </div>
      </div>
    </footer>
    <vs-dialog v-model="datasetDialog">
      <template #header>
        <h4>選擇資料集</h4>
      </template>
      <div class="datasetDialog-form">
        <vs-select v-model="yearSemVal" @change="datasetSelected" v-if="yearSemItems" label="學期">
          <vs-option label="選擇學期" value="no" disabled>選擇學期</vs-option>
          <vs-option
            v-for="(item, i) in yearSemItems"
            :label="parseYearSemVal(item)"
            :value="item"
            :key="i">
            {{
                parseYearSemVal(item)
            }}
          </vs-option>
        </vs-select>
        <br />
        <vs-select v-model="departmentVal" @change="datasetSelected" label="學制">
          <vs-option label="選擇學制" value="no" disabled>選擇學制</vs-option>
          <vs-option
            v-for="(item, i) in departmentItems"
            :label="item"
            :value="i"
            :key="i">{{ item }}</vs-option>
        </vs-select>
      </div>
      <template #footer>
        <div class="datasetDialog-footer">
          <vs-button block @click="datasetDialog = false">完成</vs-button>
        </div>
      </template>
    </vs-dialog>
  </div>
</template>
<script>
import Vue from 'vue'
export default {
  data: () => ({
    active: '/',
    yearSemItems: null,
    yearSemVal: '-1',
    departmentItems: ['日間部', '進修部', '研究所(日間部、進修部、週末碩士班)'],
    departmentVal: 0,
    datasetDialog: false
  }),
  mounted() {
    if (localStorage['data-department'] != 'main') {
      this.departmentVal = this.departmentItems.indexOf(localStorage['data-department'])
    }
  },
  async created() {
    // detect dark mode
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    themeSwitch(darkModeMediaQuery.matches)
    darkModeMediaQuery.addListener(e => {
      const darkModeOn = e.matches
      themeSwitch(darkModeOn)
    })
    function themeSwitch(darkModeOn) {
      document.body.setAttribute('vs-theme', darkModeOn ? 'dark' : 'light')
    }
    String.prototype.trimEllip = function (length) {
      return this.length > length ? this.substring(0, length) + '...' : this
    }
    Vue.prototype.$fetchCourse = async (y, s, department, commit = true) => {
      //replace yr & sem if query seleted
      let { year, sem, d } = this.$route.query
      if (year && sem && d) {
        y = year
        s = sem
        department = d
      }
      if (!y || !s) {
        let yearData = await this.$fetchYearData()
        // trying get from localStorage
        if (localStorage['data-year'] && localStorage['data-sem']) {
          y = localStorage['data-year']
          s = localStorage['data-sem']
        } else {
          let yrs = Object.keys(yearData)
          y = yrs[yrs.length - 1]
          s = yearData[y].length
        }
      }
      if (!department) {
        department = localStorage['data-department'] || 'main'
        this.departmentVal = this.departmentItems.indexOf(department)
        if (this.departmentVal == -1) this.departmentVal = 0
      }
      this.yearSemVal = `${y}-${s}`
      let dataKey = `course_${y}_${s}_${department}`

      let loading
      try {
        if (!window[dataKey]) {
          loading = this.$vs.loading({
            text: '下載課程清單...'
          })
          window[dataKey] = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/${y}/${s}/${department}.json`).then(x => x.json())
          loading.close()
        }
        if (commit) {
          this.$store.commit('updateYear', y)
          this.$store.commit('updateSem', s)
          this.$store.commit('updateDepartment', department)
        }
        return window[dataKey]
      } catch (e) {
        this.$vs.notification({
          title: '擷取資料時發生了錯誤',
          text: e,
          color: 'danger'
        })
        loading.close()

        this.$store.commit('updateYear', '109')
        this.$store.commit('updateSem', '2')
        this.$store.commit('updateDepartment', 'main')
      }
    }
    Vue.prototype.$fetchYearData = async () => {
      let key = `main_year`
      try {
        let res = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/main.json`).then(x => x.json())
        sessionStorage[key] = JSON.stringify(res)
        return JSON.parse(sessionStorage[key])
      } catch (e) {
        this.$vs.notification({
          title: '擷取資料時發生了錯誤',
          text: e,
          color: 'danger'
        })
      }
    }
    Vue.prototype.$checkIsInCourse = id => {
      let { year, sem } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      let myCourseData = JSON.parse(localStorage[myCourseKey] || '[]')
      return Boolean(myCourseData.includes(id))
    }
    Vue.prototype.$checkConflictedCourse = async (courses, pushMyCourse = false) => {
      let { year, sem } = this.$store.state
      // get my course
      let myCourseKey = `my-couse-data-${year}-${sem}`
      let myCourseData = JSON.parse(localStorage[myCourseKey] || '[]')
      let myCourses = (await this.$fetchCourse(year, sem)).filter(x => myCourseData.includes(x.id))

      function checkConflict(a, b) {
        for (let i of Object.entries(a.time)) {
          for (let j of i[1]) {
            if (b.time[i[0]].includes(j)) {
              return true
            }
          }
        }
        return false
      }

      let conflictCourseIds = []
      for (let dataCourse of courses) {
        for (let myCourse of myCourses) {
          if (checkConflict(dataCourse, myCourse) && dataCourse.id != myCourse.id) {
            let pushId = pushMyCourse ? myCourse.id : dataCourse.id
            if (!conflictCourseIds.includes(pushId)) {
              conflictCourseIds.push(pushId)
            }
          }
        }
      }
      return conflictCourseIds
    }
    Vue.prototype.$addCourse = id => {
      let { year, sem } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      let myCourseData = JSON.parse(localStorage[myCourseKey] || '[]')
      if (!myCourseData.includes(id)) {
        myCourseData.push(id)
      }
      localStorage[myCourseKey] = JSON.stringify(myCourseData)
    }
    Vue.prototype.$removeCourse = id => {
      let { year, sem } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      let myCourseData = JSON.parse(localStorage[myCourseKey] || '[]')
      myCourseData = myCourseData.filter(x => x != id)
      localStorage[myCourseKey] = JSON.stringify(myCourseData)
    }
    await this.initYearSem()
    await this.$fetchCourse()
    this.$router.beforeEach((to, from, next) => {
      this.active = to.path
      next()
    })
  },
  methods: {
    async initYearSem() {
      let d = await this.$fetchYearData()
      let res = []
      for (let year of Object.keys(d).reverse()) {
        for (let sem of d[year].reverse()) {
          res.push(`${year}-${sem}`)
        }
      }
      this.yearSemItems = res
      this.departmentVal = res[0]
    },
    parseYearSemVal(v) {
      let s = v.split('-')
      return `${s[0]} 年${s[1] == '1' ? '上' : '下'}學期`
    },
    datasetSelected() {
      let s = this.yearSemVal.split('-')
      let department = this.departmentItems[this.departmentVal]
      if (this.departmentVal == 0) {
        department = 'main'
      }

      this.$fetchCourse(s[0], s[1], department)
    }
  }
}
</script>
<style lang="sass">
#app
  display: flex
  flex-direction: column
  min-height: 100vh
  .container
    flex: 1
    padding-top: 74px
    width: 1024px
    max-width: 97%
    margin: 0 auto
  #footer
    margin: 0 auto
    margin-top: 10px
    text-align: center
    font-size: .85rem
    opacity: .7
    padding: 0 15px
    width: 100%
    background: rgba(var(--vs-background), 1)
    border-radius: 15px 15px 0px 0px
    box-shadow: 0px 5px 25px 0px rgba(0, 0, 0, var(--vs-shadow-opacity))
.datasetDialog-form
  .vs-select-content
    max-width: 100%
</style>
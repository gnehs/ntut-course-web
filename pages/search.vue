<template>
  <div>
    <h1>搜尋</h1>
    <card>
      <div class="cards" style="--card-row: 4; --card-row-sm: 2">
        <card class="borderless">
          <p>課號</p>
          <vs-input v-model="searchCourseId" @input="searchCourse" />
        </card>
        <card class="borderless">
          <p>關鍵字</p>
          <vs-input v-model="searchVal" @input="searchCourse" />
        </card>
        <card class="borderless">
          <p>教師</p>
          <vs-input v-model="searchTeacher" @input="searchCourse" />
        </card>
        <card class="borderless">
          <p>班級</p>
          <vs-input v-model="searchClass" @input="searchCourse" />
        </card>
        <card class="borderless">
          <p>衝堂</p>
          <vs-checkbox v-model="showConflictCourse">顯示衝堂課程</vs-checkbox>
        </card>
        <card class="borderless">
          <p>篩選</p>

          <vs-button flat @click="timetableDialog = true"> <i class="bx bxs-filter-alt"></i>依時間篩選 </vs-button>
        </card>
      </div>
      <p style="font-size: 0.85rem">
        ＊關鍵字、教師與班級欄位支援
        <a href="https://en.wikipedia.org/wiki/Regular_expression" teaget="_blank">regex</a>！
      </p>
    </card>
    <vs-alert v-show="onError" style="margin-top: 16px">
      <template #title>搜尋時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>
    <parse-courses :courses="searchResult" :show-conflict-course="showConflictCourse" />
    <vs-dialog v-model="timetableDialog">
      <template #header>
        <h4 style="margin: 0">依時間篩選課程</h4>
      </template>
      <div class="timetable">
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
              style="justify-content: center; font-size: 2em; padding: 4px 6px"
            >
              <i class="bx bx-check" v-if="!timetableFilter[date].includes(time)" />
              <i class="bx bx-x" v-else />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="lr-container nowrap">
          <div class="l" style="width: 50%">
            <vs-button block @click="resetTimetable">重置</vs-button>
          </div>
          <div class="r" style="width: 50%">
            <vs-button
              block
              @click="
                timetableDialog = false
                searchCourse()
              "
              >確定</vs-button
            >
          </div>
        </div>
      </template>
    </vs-dialog>
  </div>
</template>
  
<script>
export default {
  data: () => ({
    onError: null,
    courseData: null,
    searchVal: '',
    searchCourseId: '',
    searchTeacher: '',
    searchClass: '',
    searchResult: null,
    showConflictCourse: true,
    timetableDialog: false,
    timetable: ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C'],
    dateEng2zh: { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' },
    timetableFilter: {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: []
    }
  }),
  head() {
    return {
      title: '搜尋'
    }
  },
  created() {
    let { q, id, teacher, classroom, hideConflict } = this.$route.query
    this.searchVal = q || ''
    this.searchCourseId = id || ''
    this.searchTeacher = teacher || ''
    this.searchClass = classroom || ''
    this.showConflictCourse = Boolean(!hideConflict)
    if (this.$route.query[`time-table`]) {
      this.timetableFilter = JSON.parse(this.$route.query[`time-table`])
    }
    this.searchCourse()
  },
  watch: {
    showConflictCourse(newCount, oldCount) {
      this.searchCourse()
    }
  },
  methods: {
    async fetchCourseData() {
      if (!this.courseData) {
        let { year, sem } = this.$route.query
        this.courseData = await this.$fetchCourse(year, sem)
      }
      return this.courseData
    },
    async searchCourse() {
      try {
        this.onError = null
        let course = await this.fetchCourseData()
        let query = Object.assign({}, this.$route.query)
        if (this.searchVal != '') {
          course = course.filter(x => x.name.zh.match(this.searchVal))
          query.q = this.searchVal
        } else {
          delete query.q
        }
        if (this.searchCourseId != '') {
          let searchCourseId = this.searchCourseId
          course = course.filter(x => x.id.startsWith(searchCourseId))
          query.id = searchCourseId
        } else {
          delete query.id
        }
        if (this.searchTeacher != '') {
          let searchTeacher = this.searchTeacher
          course = course.filter(x =>
            x.teacher
              .map(y => y.name)
              .join('')
              .match(searchTeacher)
          )
          query.teacher = searchTeacher
        } else {
          delete query.teacher
        }
        if (this.searchClass != '') {
          let searchClass = this.searchClass
          course = course.filter(x =>
            x.class
              .map(y => y.name)
              .join('')
              .match(searchClass)
          )
          query.classroom = searchClass
        } else {
          delete query.classroom
        }
        if (!this.showConflictCourse) {
          query.hideConflict = true
        } else {
          delete query.hideConflict
        }
        //timetableFilter
        course = course.filter(x => {
          for (let date of Object.keys(this.timetableFilter)) {
            for (let time of this.timetable) {
              if (this.timetableFilter[date].includes(time) && x.time[date].includes(time)) {
                return false
              }
            }
          }
          return true
        })
        delete query[`time-table`]
        let isTimetableFilterEnabled = false
        for (let date of Object.keys(this.timetableFilter)) {
          if (this.timetableFilter[date].length > 0) {
            isTimetableFilterEnabled = true
            break
          }
        }
        if (isTimetableFilterEnabled) {
          query[`time-table`] = JSON.stringify(this.timetableFilter)
        } else {
          delete query[`time-table`]
        }
        //
        this.searchResult = course
        this.$router.replace({ path: '/search', query }, () => {})
      } catch (e) {
        this.onError = e
        this.searchResult = []
      }
    },
    // ------------------
    //      Timetable
    // ------------------
    resetTimetable() {
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
  }
}
</script> 
<template>
  <div>
    <vs-alert v-if="myCourses.length" key="notice">
      <template #title>提醒</template>
      請注意，本資料僅儲存在瀏覽器中，可能會隨時消失！
    </vs-alert>
    <div class="lr-container nowrap">
      <div class="l">
        <h1>我的課程</h1>
      </div>
      <div class="r">
        <vs-button flat @click="exportData"> <i class="bx bxs-file-export"></i>匯出 </vs-button>
        <vs-button flat @click="importData"> <i class="bx bxs-file-import"></i>匯入 </vs-button>
      </div>
    </div>
    <p style="margin-top: -1em">你可以在這裡儲存一些課程供未來選課時參考用，在此處的課程會與其他課程比對並顯示是否衝堂。</p>
    <vs-alert v-if="!myCourses.length" key="noCourses">
      <template #title>尚未儲存任何課程</template>
      你可以在班級頁面或是課程頁面右上方找到「加入我的課程」按鈕！
      <br />若這裡沒有先前加入的課程，可能是選擇了錯誤的資料集，請嘗試於右上按鈕切換資料集。
    </vs-alert>
    <h3 v-show="myCourses.length">建議</h3>
    <div class="cards" style="--card-row: 3; --card-row-sm: 2" v-show="myCourses.length">
      <card class="hoverable padding" :to="`/widget?year=${$store.state.year}`">
        <card-title>iOS 小工具</card-title>
        <p>在桌面上檢視接下來的課程</p>
        <i class="bx bx-extension"></i>
      </card>
      <card class="hoverable padding" :to="`/add-calendar?year=${$store.state.year}`">
        <card-title>新增到行事曆</card-title>
        <p>將我的課程匯入至行事曆</p>
        <i class="bx bx-calendar"></i>
      </card>
    </div>
    <h3 v-show="myCourses.length">課程</h3>
    <div class="cards" style="--card-row: 3; --card-row-sm: 3" v-show="myCourses.length">
      <card>
        <card-title>{{ myCourseCredit }}</card-title>
        <p>學分</p>
        <i class="bx bx-book"></i>
      </card>
      <card>
        <card-title>{{ myCourseHours }}</card-title>
        <p>時數</p>
        <i class="bx bx-time"></i>
      </card>
      <card>
        <card-title>{{ myCourses.length }}</card-title>
        <p>課程數</p>
        <i class="bx bx-category-alt"></i>
      </card>
    </div>
    <parse-courses :courses="myCourses" showTimetable v-if="myCourses.length" />
    <h3>贊助商廣告</h3>
    <adsbygoogle />
  </div>
</template>

<script>
export default {
  data: () => ({
    onError: null,
    myCourses: [],
    myCourseCredit: 0,
    myCourseHours: 0
  }),
  head() {
    return {
      title: '我的課程'
    }
  },
  computed: {
    year() {
      return this.$store.state.year
    },
    sem() {
      return this.$store.state.sem
    },
    department() {
      return this.$store.state.department
    }
  },
  watch: {
    year(newCount, oldCount) {
      this.getMyCourse()
    },
    sem(newCount, oldCount) {
      this.getMyCourse()
    },
    department(newCount, oldCount) {
      this.getMyCourse()
    }
  },
  created() {
    this.getMyCourse()
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
      this.myCourses = course.filter(x => courseIds.includes(x.id))
      this.myCourseCredit = this.myCourses
        .map(x => x.credit)
        .map(parseFloat)
        .reduce((a, b) => a + b)
      this.myCourseHours = this.myCourses
        .map(x => x.hours)
        .map(parseFloat)
        .reduce((a, b) => a + b)
    },
    exportData() {
      let { year, sem } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      let myCourseClassKey = `my-couse-class-${year}-${sem}`

      let res = JSON.stringify({
        key: myCourseKey,
        data: localStorage[myCourseKey],
        classKey: myCourseClassKey,
        classData: localStorage[myCourseClassKey]
      })
      prompt('請複製以下資料：', res)
    },
    importData() {
      let importedData = prompt('請貼上先前複製的資料：')
      if (importedData) {
        let { key, data, classKey, classData } = JSON.parse(importedData)
        localStorage[key] = data
        localStorage[classKey] = classData

        this.$vs.notification({
          title: '匯入完成！',
          text: `已匯入 ${JSON.parse(localStorage[key]).length} 筆課程到我的課程`
        })
        this.getMyCourse()
      }
    }
  }
}
</script>
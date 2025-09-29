<template>
  <div>
    <div class="lr-container">
      <div class="l">
        <h1>{{ programname }}</h1>
      </div>
      <div class="r">
        <vs-button
          transparent
          :active="showConflictCourse"
          @click="showConflictCourse = !showConflictCourse">
          <i class="bx bx-check" v-if="showConflictCourse"></i>
          <i class="bx bx-x" v-else></i>衝堂課程
        </vs-button>
        <vs-button flat @click="addCourse2myCourse" v-if="!isInMyCouse">
          <i class="bx bx-plus"></i>加入我的課程
        </vs-button>
        <vs-button flat danger @click="removeFromMyCourse" v-else>
          <i class="bx bx-minus"></i>從我的課程移除
        </vs-button>
      </div>
    </div>
    <vs-alert v-show="onError">
      <template #title>擷取資料時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>

    <parse-courses
      v-show="result && result.length"
      :courses="result"
      show-timetable
      :show-conflict-course="showConflictCourse" />
    <vs-alert v-if="result && !result.length && programData">
      <template #title>查無資料</template>
      <a
        :href="'https://aps.ntut.edu.tw/course/tw/' + programData.href"
        target="_blank">前往原始網頁</a>
      看看原本的資料
    </vs-alert>

    <h3>贊助商廣告</h3>
    <adsbygoogle />
  </div>
</template>

<script>
export default {
  data: () => ({
    onError: null,
    result: null,
    programData: null,
    programname: '微學程',
    isInMyCouse: false,
    showConflictCourse: true
  }),
  head() {
    return {
      title: this.programname
    }
  },
  created() {
    this.getCourseByProgram()
  },
  methods: {
    async getCourseByProgram() {
      const loading = this.$vs.loading()
      try {
        let { year, sem, id } = this.$route.params
        // fetch program list
        let programList = await fetch(
          this.$api(`/${year}/${sem}/mprogram.json`)
        ).then(x => x.json())
        this.programData = programList.find(x => x.id == id)
        if (this.programData) {
          this.programname = this.programData.name
        }
        // fetch courses
        let course = await this.$fetchCourse(year, sem)
        if (this.programData && this.programData.course) {
          course = course.filter(x => this.programData.course.includes(x.id))
        } else {
          course = []
        }
        this.result = course
        this.checkIsInMyCourse()
      } catch (e) {
        this.onError = e
        loading.close()
      }
      loading.close()
    },
    checkIsInMyCourse() {
      let { year, sem } = this.$route.params
      let key = `my-couse-mprogram-${year}-${sem}`
      this.isInMyCouse = localStorage[key] == this.programname
    },
    addCourse2myCourse() {
      let { year, sem } = this.$route.params
      let key = `my-couse-mprogram-${year}-${sem}`
      if (localStorage[key] != this.programname && localStorage[key]) {
        let change = confirm(`你先前已將「${localStorage[key]}」之課程加入我的課程，此行為會導致課程過多，要繼續嗎？`)
        if (!change) {
          return
        }
      }
      localStorage[key] = this.programname
      for (let course of this.result) {
        this.$addCourse(course.id)
      }
      this.isInMyCouse = true
      this.$vs.notification({
        title: '加入完成！',
        text: `已將「${this.programname}」加入到我的課程`
      })
    },
    removeFromMyCourse() {
      let { year, sem } = this.$route.params
      for (let course of this.result) {
        this.$removeCourse(course.id)
      }
      localStorage.removeItem(`my-couse-mprogram-${year}-${sem}`)
      this.isInMyCouse = false
      this.$vs.notification({
        title: '已移除',
        text: `已將「${this.programname}」從我的課程中移除`
      })
    }
  }
}
</script>

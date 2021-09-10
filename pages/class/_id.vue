<template>
  <div>
    <div class="lr-container">
      <div class="l">
        <h1>{{ classname }}</h1>
      </div>
      <div class="r">
        <vs-button transparent :active="showConflictCourse" @click="showConflictCourse = !showConflictCourse">
          <i class="bx bx-check" v-if="showConflictCourse"></i>
          <i class="bx bx-x" v-else></i>衝堂課程
        </vs-button>
        <vs-button flat @click="addCourse2myCourse" v-if="!isInMyCouse"> <i class="bx bx-plus"></i>加入我的課程 </vs-button>
        <vs-button flat danger @click="removeFromMyCourse" v-else> <i class="bx bx-minus"></i>從我的課程移除 </vs-button>
      </div>
    </div>
    <vs-alert v-show="onError">
      <template #title>擷取資料時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>

    <parse-courses v-show="result && result.length" :courses="result" show-timetable :show-conflict-course="showConflictCourse" />
    <vs-alert v-if="result && !result.length && classData">
      <template #title>查無資料</template>
      資料抓取時似乎沒有抓到這邊的資料（？
      <br />也許你可以試試看
      <a :href="'https://aps.ntut.edu.tw/course/tw/' + classData.href" target="_blank">前往原始網頁</a>
      看看原本的資料
    </vs-alert>
  </div>
</template>
  
<script>
export default {
  data: () => ({
    onError: null,
    result: null,
    classData: null,
    classname: '班級',
    isInMyCouse: false,
    showConflictCourse: true
  }),
  head() {
    return {
      title: this.classname
    }
  },
  created() {
    this.getCourseByClass()
  },
  methods: {
    async getCourseByClass() {
      const loading = this.$vs.loading()
      try {
        let { year, sem } = this.$store.state
        this.classname = this.$route.params.id
        //fetch class
        let departmentData = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler-node/${year}/${sem}/department.json`)).data
        departmentData.map(x => {
          x.class.map(y => {
            if (y.name == this.classname) {
              this.classData = y
            }
          })
        })
        // fetch course
        let classname = this.classname
        let course = await this.$fetchCourse(year, sem)
        function detectClass(c) {
          let d = c.map(x => x.name)
          return d.includes(classname)
        }
        course = course.filter(x => detectClass(x.class))
        this.result = course
        this.checkIsInMyCourse()
      } catch (e) {
        this.onError = e
        loading.close()
      }
      loading.close()
    },
    checkIsInMyCourse() {
      let { year, sem } = this.$store.state
      let myCourseClassKey = `my-couse-class-${year}-${sem}`
      this.isInMyCouse = localStorage[myCourseClassKey] == this.classname
    },
    addCourse2myCourse() {
      let { year, sem } = this.$store.state
      let myCourseClassKey = `my-couse-class-${year}-${sem}`
      if (localStorage[myCourseClassKey] != this.classname && localStorage[myCourseClassKey]) {
        let changeClass = confirm(`您先前已將「${localStorage[myCourseClassKey]}」之課程加入我的課程，此行為會導致課程過多，要繼續嗎？`)
        if (!changeClass) {
          return
        }
      }
      localStorage[myCourseClassKey] = this.classname
      for (let course of this.result) {
        this.$addCourse(course.id)
      }
      this.isInMyCouse = true
      this.$vs.notification({
        title: '加入完成！',
        text: `已將「${this.classname}」加入到我的課程`
      })
    },
    removeFromMyCourse() {
      let { year, sem } = this.$store.state
      for (let course of this.result) {
        this.$removeCourse(course.id)
      }
      localStorage.removeItem(`my-couse-class-${year}-${sem}`)
      this.isInMyCouse = false
      this.$vs.notification({
        title: '已移除',
        text: `已將「${this.classname}」從我的課程中移除`
      })
    }
  }
}
</script>
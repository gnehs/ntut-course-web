<template>
  <div v-if="filteredDepartmentData">
    <h1>選擇班級</h1>
    <div class="cards" style="--card-row: 4; --card-row-sm: 1">
      <card>
        <p>輸入關鍵字來篩選</p>
        <vs-input v-model="filterDapartmentVal" @input="filterDapartment" />
      </card>
    </div>
    <vs-alert v-show="onError">
      <template #title>搜尋時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>
    <div v-if="recommendClass.length">
      <h3>建議</h3>
      <p>根據你先前儲存的班級所提供的建議</p>
      <div class="cards" style="--card-row: 5; --card-row-sm: 3">
        <card
          class="hoverable padding"
          v-for="(item, index) in recommendClass"
          :key="index"
          :to="`/class/${item.name}?year=${year}&sem=${sem}&d=${$store.state.department}`"
        >
          <card-title>{{ item.name }}</card-title>
          <p>{{ item.description }}</p>
          <i class="bx bx-star"></i>
        </card>
      </div>
    </div>
    <div v-for="department in filteredDepartmentData" :key="department.name">
      <h3>{{ department.name }}</h3>
      <div class="cards" style="--card-row: 5; --card-row-sm: 3">
        <card
          v-for="{ name } in department.class"
          :key="name"
          class="hoverable padding"
          :to="`/class/${name}?year=${year}&sem=${sem}&d=${$store.state.department}`"
        >
          <card-title>{{ name }}</card-title>
          <p>{{ department.name }}</p>
        </card>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  created() {
    this.fetchData()
  },
  data: () => ({
    onError: null,
    savedClass: null,
    departmentData: null,
    filteredDepartmentData: null,
    filterDapartmentVal: null,
    recommendClass: [],
  }),
  head() {
    return {
      title: '上課時間表'
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
      this.fetchData()
    },
    sem(newCount, oldCount) {
      this.fetchData()
    }
  },
  methods: {
    async fetchData() {
      const loading = this.$vs.loading()
      try {
        this.departmentData = await fetch(
          `https://gnehs.github.io/ntut-course-crawler-node/${this.year}/${this.sem}/department.json`
        ).then(x => x.json())
        this.filteredDepartmentData = this.departmentData
        loading.close()
      } catch (e) {
        loading.close()
      }
      // flat map class
      let classData = this.departmentData.map(x => x.class).flat()
      // myCourseClassKey
      let { year, sem } = this.$store.state
      let myCourseClassKey = `my-couse-class-${year}-${sem}`
      // convert savedClass to 'my-class'
      if (localStorage[myCourseClassKey] && !localStorage['my-class']) {
        localStorage['my-class'] = classData.filter(x => x.name == localStorage[myCourseClassKey])[0].id
      }
      // show recommendClass
      let classId = localStorage['my-class']
      if (classId) {
        this.recommendClass = []
        let userClass = classData.filter(x => x.id == classId)[0]
        if(userClass){
          this.recommendClass.push({ ...userClass, description: '你的班級' })
        }
        // 取得博雅課程推薦
        let classname = userClass.name
        let course = await this.$fetchCourse(year, sem)
        function detectClass(c) {
          let d = c.map(x => x.name)
          return d.includes(classname)
        }
        course = course.filter(x => detectClass(x.class))
        let generalEducationClass = course.filter(x => x.notes && x.notes.startsWith('請選：通識中心')).map(x => x.notes.replace('請選：通識中心', '').replace(/ |\//g, ''))
        for (let name of generalEducationClass) {
          let className = classData.filter(x => x.name.replace(/ |\//g, '') == name)[0]
          if (className) {
            this.recommendClass.push({ ...className, description: '博雅課程' })
          }
        }
        console.log(generalEducationClass)
      }
    },
    filterDapartment() {
      this.onError = null
      try {
        let val = this.filterDapartmentVal
        if (val != '') {
          this.filteredDepartmentData = this.departmentData
            .filter(
              x =>
                x.name.match(val) ||
                x.class
                  .map(a => a.name)
                  .join('')
                  .match(val)
            )
            .map(x => {
              x.class = x.class.filter(y => y.name.match(val))
              return x
            })
            .filter(x => x.class.length)
        } else {
          this.filteredDepartmentData = this.departmentData
        }
      } catch (e) {
        this.onError = e
        this.filteredDepartmentData = []
      }
    },
    generateRandomColor(i) {
      let r, g, b
      r = ((i * 929) % 50) + (255 - 40)
      g = ((i * 199) % 50) + (255 - 40)
      b = ((i * 680) % 50) + (255 - 40)
      return `rgb(${r},${g},${b})`
    }
  }
}
</script>

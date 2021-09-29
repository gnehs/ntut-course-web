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
    <div v-if="savedClass">
      <h3>我的班級</h3>
      <div class="cards" style="--card-row: 5; --card-row-sm: 3">
        <card class="hoverable padding" :to="`/class/${savedClass}?year=${year}&sem=${sem}&d=${$store.state.department}`">
          <card-title>{{ savedClass }}</card-title>
          <p>我的班級</p>
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
    filterDapartmentVal: null
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
      // show savedClass
      let { year, sem } = this.$store.state
      let myCourseClassKey = `my-couse-class-${year}-${sem}`
      this.savedClass = localStorage[myCourseClassKey]
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
    generateRandomColor(i, j) {
      let r, g, b
      r = ((i * 929) % 50) + (255 - 40)
      g = ((i * 199) % 50) + (255 - 40)
      b = ((i * 680) % 50) + (255 - 40)
      return `rgb(${r},${g},${b})`
    }
  }
}
</script>

<template>
  <div>
    <h1>退選率</h1>
    <p>這是該學期所有教師的退選率（退選人數/選課人數）的計算結果</p>
    <div class="teachers">
      <div class="teacher" v-for="item of data" :key="item.name">
        <h2 class="name">{{ item.name }}</h2>
        <div class="rate">{{ item.rate_percent }}%</div>
        <div class="people">{{ item.withdraw }} 人退選 / {{ item.people }} 人選課</div>
      </div>
    </div>
  </div>
</template>
<style lang="sass" scoped>

.teachers
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
  margin-top: 1rem
  gap: 8px
  .teacher
    padding: 16px
    border: 1px solid #eee
    border-radius: 5px
    background-color: #fff
    .name
      font-size: 16px
      margin: 0
    .rate
      font-weight: bold
      font-size: 18px
    .people
      font-size: 12px
      opacity: .8
    // dark-mode
    @media (prefers-color-scheme: dark)
      border-color: #333
      background-color: #333
      color: #fff
</style>
<script>
export default {
  created() {
    this.getData()
  },
  data() {
    return ({
      data: {}
    })
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
      this.getData()
    },
    sem(newCount, oldCount) {
      this.getData()
    }
  },
  methods: {
    async getData() {
      let { year, sem } = this.$store.state
      let data = await this.$fetchCourse(year, sem)
      let result = {}
      for (let course of data) {
        for (let teacher of course.teacher) {
          let name = teacher.name
          if (!result[name]) {
            result[name] = {
              name,
              withdraw: 0,
              people: 0,
              course: 0,
              rate: -1
            }
            result[name].withdraw += parseInt(course.peopleWithdraw)
            result[name].people += parseInt(course.people)
            result[name].course += 1
          }
        }
      }
      // calc rate
      for (let name in result) {
        let item = result[name]
        item.rate = item.withdraw / item.people
        // 四捨五入
        item.rate_percent = (item.rate * 100).toFixed(2)
      }
      // sort by rate  
      this.data = Object.values(result).filter(x => x.people).sort((a, b) => b.rate - a.rate)
    }
  }
}
</script>
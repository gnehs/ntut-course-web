<template>
  <div>
    <h1>退選率</h1>
    <p>這是該學期所有教師的退選率（退選人數/選課人數）的計算結果</p>
    <div style="display:flex; justify-content: space-between;">
      <vs-checkbox v-model="showPeopleBelow10">顯示選課小於十人的教師</vs-checkbox>
      <vs-select placeholder="期間" v-model="period" state="dark" @change="getData">
        <vs-option :label="`僅目前學期`" :value="1">
          {{ year }} 年{{ sem == '1' ? '上' : '下' }}學期
        </vs-option>
        <vs-option label="過去兩年" :value="4">
          過去兩年
        </vs-option>
        <vs-option label="過去五年" :value="10">
          過去五年
        </vs-option>
      </vs-select>
    </div>
    <div class="cards" style="--card-row: 2;" v-if="data.length">
      <card v-for="(item, i) of stat" :key="i">
        <card-title>{{ item.value }}</card-title>
        <p>{{ item.title }}</p>
      </card>
    </div>
    <div class="teachers">
      <div
        class="teacher"
        v-for="item of data"
        :key="item.name"
        v-show="showPeopleBelow10 || item.people >= 10"
        @click="openDialog(item)">
        <h2 class="name">{{ item.name }}</h2>
        <div class="rate">{{ item.rate_percent }}%</div>
        <div class="people">{{ item.withdraw }} 人退選 / {{ item.people }} 人選課</div>
      </div>
    </div>
    <vs-alert color="info" v-if="!data.length">
      <template #title>沒有資料</template>
      可能是學期尚未開始或是沒有選課資料，你可以嘗試點選右上角按鈕切換資料集來查看其他學期的資料
    </vs-alert>
    <vs-dialog v-model="dialog">
      <div v-if="dialogData">
        <h3>{{ dialogData.name }}</h3>
        <div class="cards" style="--card-row: 4;">
          <card>
            <card-title>{{ dialogData.rate_percent }}%</card-title>
            <p>退選率</p>
          </card>
          <card>
            <card-title>{{ dialogData.withdraw }}</card-title>
            <p>退選人數</p>
          </card>
          <card>
            <card-title>{{ dialogData.people }}</card-title>
            <p>選課人數</p>
          </card>
          <card>
            <card-title>{{ dialogData.course.length || 0 }}</card-title>
            <p>課程數</p>
          </card>
        </div>
        <div class="course-items">
          <div class="course-item" v-for="course of dialogData.course" :key="course.id"
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
      </div>
    </vs-dialog>
  </div>
</template>
<style lang="sass" scoped>

.teachers
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
  margin-top: 1rem
  gap: 8px
  .teacher
    padding: 16px
    border-radius: 5px
    background-color: #fff
    box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
    transition: all .25s ease
    &:hover
      cursor: pointer
      box-shadow: 0 10px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
      transform: translate(0, -5px)
      color: var(--vs-text)
    &:active
      box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, var(--vs-shadow-opacity,0))
      transform: translate(0, 5px)
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
    border: 1px solid #eee
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
<script>
export default {
  head() {
    return {
      title: '退選率'
    }
  },
  created() {
    let query = Object.assign({}, this.$route.query)
    if (query.period) {
      this.period = parseInt(query.period)
    }
    this.getData()
  },
  data() {
    return ({
      period: 1,
      data: {},
      dialog: false,
      dialogData: false,
      showPeopleBelow10: true,
      stat: []
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
      let period = this.period
      let data

      if (period > 1) {
        // update query
        this.$router.replace({ path: '/withdrawal', query: { period } }, () => { })
        //getdata
        let res = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/main.json`).then(x => x.json())
        res = Object.entries(res)
          .map(([y, s]) => s.map(x => ({ year: y, sem: x })))
          .flat()
          .reverse()
          .slice(0, period)
          .reverse()

        data = res.map(async ({ year, sem }) => (await this.$fetchCourse(year, sem, null, false)).map(x => ({ ...x, year, sem })))
        data = await Promise.all(data)
        data = data.flat()
      } else {
        // update query
        this.$router.replace({ path: '/withdrawal', query: {} }, () => { })
        //getdata
        let { year, sem } = this.$store.state
        data = (await this.$fetchCourse(year, sem)).map(x => ({ ...x, year, sem }))
      }
      let result = {}
      let totalPeople = 0, totalWithdraw = 0, totalCourse = 0
      for (let course of data) {
        for (let teacher of course.teacher) {
          let name = teacher.name
          if (!result[name]) {
            result[name] = {
              name,
              withdraw: 0,
              people: 0,
              course: [],
              rate: -1
            }
          }
          result[name].withdraw += parseInt(course.peopleWithdraw)
          result[name].people += parseInt(course.people)
          result[name].course.push(course)
          totalPeople += parseInt(course.people)
          totalWithdraw += parseInt(course.peopleWithdraw)
          totalCourse++
        }
      }
      // calc rate
      for (let name in result) {
        let item = result[name]
        item.rate = item.withdraw / item.people
        // 四捨五入
        item.rate_percent = (item.rate * 100).toFixed(2)
      }
      this.stat = [{
        value: (totalWithdraw / totalPeople * 100).toFixed(2) + '%',
        title: '平均退選率',
      },]
      // sort by rate
      this.data = Object.values(result).filter(x => x.people).sort((a, b) => b.rate - a.rate)
      // calc quartiles
      let rates = this.data.sort().map(x => x.rate * 100).reverse()
      console.log(rates)
      let quartiles = Math.floor(rates.length / 4)
      let q1 = rates[quartiles]
      let q2 = rates[quartiles * 2]
      let q3 = rates[quartiles * 3]
      this.stat.push({
        value: q1.toFixed(2) + '% - ' + q2.toFixed(2) + '% - ' + q3.toFixed(2) + '%',
        title: '退選率分位數'
      })

    },
    openDialog(item) {
      this.dialogData = item
      this.dialog = true
    }
  }
}
</script>
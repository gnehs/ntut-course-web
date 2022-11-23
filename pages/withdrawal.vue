<template>
  <div>
    <h1>退選率</h1>
    <p>這是期間中所有教師的退選率統計頁面</p>
    <div style="display:flex; justify-content: space-between;">
      <div></div>
      <div style="display:flex;align-items: center;">
        <vs-select placeholder=" 期間" v-model="period" state="dark" @change="getData" style="max-width: 120px">
          <vs-option label="過去三年" value="-recent-3-years">
            過去三年
          </vs-option>
          <vs-option label="過去五年" value="-recent-5-years">
            過去五年
          </vs-option>
          <vs-option label="所有期間" value="all">
            所有期間
          </vs-option>
        </vs-select>
      </div>
    </div>
    <loader v-if="!data" />

    <div class="cards" style="--card-row: 2;--card-row-sm: 1;" v-if="stat">
      <card v-for="(item, i) of stat" :key="i">
        <card-title>{{ item.value }}</card-title>
        <p>{{ item.title }}</p>
      </card>
    </div>
    <div class="teachers" v-if="data">
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
    <vs-dialog overflow-hidden v-model="dialog">
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

<script>
export default {
  data() {
    return ({
      showPeopleBelow10: true,
      period: '-recent-3-years',
      data: null,
      stat: null,
      // dialog
      dialog: false,
      dialogData: null,
    })
  },
  mounted() {
    this.getData()
  },
  methods: {
    async getData() {
      let period = this.period == 'all' ? '' : this.period
      this.stat = null
      this.data = null
      let withdrawalData = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal${period}.json`)
        .then(res => res.json())
      this.stat = withdrawalData.stat
      this.data = withdrawalData.data
    },
    openDialog(item) {
      this.dialogData = item
      console.log(item)
      this.dialog = true
    },
  }
}
</script>

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
    border: 1px solid rgba(var(--vs-text),.1)
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
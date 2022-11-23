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
      <router-link
        :to="`/teacher/${item.name}`"
        class="teacher"
        v-for="item of data"
        :key="item.name"
        v-show="showPeopleBelow10 || item.people >= 10"
        @click="openDialog(item)">
        <h2 class="name">{{ item.name }}</h2>
        <div class="rate">{{ item.rate_percent }}%</div>
        <div class="people">{{ item.withdraw }} 人退選 / {{ item.people }} 人選課</div>
      </router-link>
    </div>
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
    color: var(--text-color)
    text-decoration: none
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
</style>
<template>
  <div>
    <h1>退選率</h1>
    <p>這是該學期所有教師的退選率（退選人數/選課人數）的計算結果</p>
    <div style="display:flex; justify-content: space-between;">
      <vs-checkbox v-model="showPeopleBelow10">顯示選課小於十人的教師</vs-checkbox>
      <div style="display:flex;align-items: center;">

        <vs-select placeholder=" 期間" v-model="period" state="dark" @change="getData" style="max-width: 120px">
          <vs-option :label="`目前學期`" :value="1">
            {{ year }} 年{{ sem == '1' ? '上' : '下' }}學期
          </vs-option>
          <vs-option label="過去兩年" :value="4">
            過去兩年
          </vs-option>
          <vs-option label="過去五年" :value="10">
            過去五年
          </vs-option>
          <vs-option :label="`過去 ${period / 2} 年`" :value="period" v-show="false" v-if="period != 1 && period != 4 && period != 10">
            過去 {{ period / 2 }} 年
          </vs-option>
        </vs-select>
        <vs-button
          icon
          color="primary"
          flat
          @click="downloadDialog = true">
          <i class='bx bx-download'></i>
        </vs-button>
      </div>
    </div>
    <div class="cards" style="--card-row: 2;--card-row-sm: 1;" v-if="data.length">
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
    <vs-dialog overflow-hidden v-model="downloadDialog">
      <template #header>
        <h4>下載資料</h4>
      </template>
      <p style="margin:0;margin-top: -1rem;font-size: .8em;opacity: .8;">請選擇檔案格式</p>
      <div style="display:flex;">
        <vs-button
          icon
          color="primary"
          block
          flat
          @click="exportFile('csv')">
          <i class='bx bxs-file-blank'></i>
          CSV
        </vs-button>
        <vs-button
          icon
          color="primary"
          block
          flat
          @click="exportFile('json')">
          <i class='bx bxs-file-json'></i>
          JSON
        </vs-button>
        <vs-button
          icon
          color="primary"
          block
          flat
          @click="exportFile('xlsx')">
          <i class='bx bxs-file-blank'></i>
          XLSX
        </vs-button>
      </div>
      <p style="margin:0;font-size: .8em;opacity: .8;">若下載的 CSV 檔案在 Excel 中顯示亂碼，請參考 <a
          href="https://data.customs.gov.tw/News_Content.aspx?n=9530920E31D22F76&sms=34935D25C6F4E5E5&s=FFE80C41B565624B"
          target="_blank">亂碼處理說明</a></p>
      <template #footer>
        <div class="datasetDialog-footer">
          <vs-button block @click="downloadDialog = false">完成</vs-button>
        </div>
      </template>
    </vs-dialog>
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
<script>
import * as XLSX from 'xlsx';
export default {
  head() {
    return {
      title: '退選率'
    }
  },
  async created() {
    let query = Object.assign({}, this.$route.query)
    if (query.period) {
      this.period = parseInt(query.period)
    }
    let lastUpdate = await this.$vlf.getItem(`withdrawal_lastUpdate_${this.period}`)
    let now = new Date()
    let diff = now - lastUpdate
    if (diff > (1000 * 60 * 60 * 24) * 30) {
      this.getData()
    } else {
      let loading = this.$vs.loading()
      this.data = await this.$vlf.getItem(`withdrawal_data_${this.period}`)
      this.stat = await this.$vlf.getItem(`withdrawal_stat_${this.period}`)
      loading.close()
    }
  },
  data() {
    return ({
      period: 1,
      data: {},
      dialog: false,
      downloadDialog: false,
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
      try {
        window.gtag('event', 'view_withdraw_rate', {
          event_category: 'view',
          event_label: '退選率',
          value: period
        })
      } catch (e) { }

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

        data = res.map(async ({ year, sem }) => (await this.$fetchCourse(year, sem, 0, false)).map(x => ({ ...x, year, sem })))
        data = await Promise.all(data)
        data = data.flat()
      } else {
        // update query
        this.$router.replace({ path: '/withdrawal', query: {} }, () => { })
        //getdata
        let { year, sem } = this.$store.state
        data = (await this.$fetchCourse(year, sem, 0, false)).map(x => ({ ...x, year, sem }))
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
      let quartiles = Math.floor(rates.length / 4)
      let q1 = rates[quartiles]
      let q2 = rates[quartiles * 2]
      let q3 = rates[quartiles * 3]
      this.stat.push({
        value: q1.toFixed(2) + '% - ' + q2.toFixed(2) + '% - ' + q3.toFixed(2) + '%',
        title: '退選率分位數'
      })
      // store
      await this.$vlf.setItem(`withdrawal_stat_${this.period}`, this.stat)
      await this.$vlf.setItem(`withdrawal_data_${this.period}`, this.data)
      await this.$vlf.setItem(`withdrawal_lastUpdate_${this.period}`, Date.now())
    },
    openDialog(item) {
      this.dialogData = item
      this.dialog = true
    },
    exportFile(filetype) {
      let data = this.data.map(x => ({
        '姓名': x.name,
        '退選率': x.rate,
        '退選人數': x.withdraw,
        '選課人數': x.people,
        '課程數': x.course.length,
        '課程代碼': x.course.map(x => x.id).join(', ')
      }))
      if (filetype == 'xlsx') {
        let workbanch = XLSX.utils.book_new()
        let worksheet = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(workbanch, worksheet, '退選率')
        let courseData = this.data
          .map(x => x.course)
          .flat()
          .map(x => ({
            '年': x.year,
            '學期': x.sem,
            '課程代碼': x.id,
            '課程類型': x.courseType,
            '課程名稱': x.name.zh,
            '英文課程名稱': x.name.en,
            '教師': x.teacher.map(x => x.name).join(', '),
            '選課人數': x.people,
            '退選人數': x.peopleWithdraw,
            '連結': `${location.origin}/course/${x.year}/${x.sem}/${x.id}`
          }))
          .filter((x, i, self) => self.findIndex(y => y.課程代碼 == x.課程代碼) == i)
          .sort((a, b) => a.課程代碼.localeCompare(b.課程代碼))
        let worksheet2 = XLSX.utils.json_to_sheet(courseData)
        XLSX.utils.book_append_sheet(workbanch, worksheet2, '課程')
        XLSX.writeFile(workbanch, this.getExportFileName('xlsx'))
      } else if (filetype == 'json') {
        this.downloadFile({ type: 'text/plain;charset=utf-8', data: JSON.stringify(this.data), ext: 'json' })
      } else if (filetype == 'csv') {
        let csv = this.$papa.unparse(data)
        this.downloadFile({ type: 'text/csv;charset=utf-8;', data: csv, ext: 'csv' })
      }
    },
    getExportFileName(ext) {
      return this.period != 1
        ? `北科課程好朋友_過去 ${this.period / 2} 年_退選率.${ext}`
        : `北科課程好朋友_${this.year} 年${this.sem == '1' ? '上' : '下'}學期_退選率.${ext}`
    },
    downloadFile({ type, data, ext }) {
      let blob = new Blob([data], { type })
      let link = document.createElement('a')
      link.href = URL.createObjectURL(blob)

      link.download = this.getExportFileName(ext)

      link.click()
    }
  }
}
</script>
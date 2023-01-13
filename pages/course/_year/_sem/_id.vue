<template>
  <div>
    <vs-alert v-show="onError">
      <template #title>擷取資料時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>
    <div v-if="fetchedCourseData && courseData">
      <div class="lr-container">
        <div class="l" style="display:block;">
          <h2 v-if="courseData.class.some(x => x.name.match(/體育/))">
            <sports-title :course-data="courseData" />
          </h2>
          <h2 v-else>
            {{ courseData.name.zh }}
            <br />
            {{ courseData.name.en }}
          </h2>
        </div>
        <div class="r">
          <vs-button flat @click="add2myCourse" v-if="!isInMyCourse">
            <i class="bx bx-plus"></i>加入我的課程
          </vs-button>
          <vs-button flat danger @click="removeFromMyCourse" v-else>
            <i class="bx bx-minus"></i>從我的課程移除
          </vs-button>
        </div>
      </div>
      <vs-alert danger v-show="isCourseConflicted">
        <template #title>課程衝堂</template>
        本課程與
        <span v-for="(item, i) in conflictCourseData" :key="item.id">
          <span v-if="i > 0">、</span>
          <router-link
            style="cursor: pointer"
            :to="`/course/${$store.state.year}/${$store.state.sem}/${item.id}`">{{ item.name.zh }}</router-link>
        </span>
        衝堂！
      </vs-alert>
      <vs-alert v-show="isEarlyEight">該課程為早八，選課前請先三思！</vs-alert>
      <div class="cards" style="--card-row: 3; --card-row-sm: 3">
        <card>
          <card-title>{{ courseData.id }}</card-title>
          <p>課號</p>
        </card>
        <card>
          <card-title>{{ courseData.credit }}</card-title>
          <p>學分</p>
        </card>
        <card>
          <vs-tooltip bottom>
            <card-title>{{ withdrawalRate ? `${withdrawalRate}%` : `無資料` }}</card-title>
            <p> 退選率 <i class='bx bx-info-circle'></i> </p>
            <template #tooltip>
              <div style="text-align: left;">
                <h4 style="margin:0;"> 什麼是退選率？ </h4>
                這項資料由教師之退選人數計算而來。
                <h4 style="margin-bottom:0;"> 退選率如何計算？ </h4>
                總退選人數 / 總選課人數
                <h4 style="margin-bottom:0;"> 如果有多名教師，退選率會怎麼顯示？ </h4>
                若該課程有多名教師，則會顯示最高退選率之教師。
                <h4 style="margin-bottom:0;"> 退選率多少算高？ </h4>
                根據近三年的統計資料，有半數教師退選率高於 1.20%；四分之一教師退選率高於 2.91%，也就是說如果你看到退選率超過 3%，你就要小心了！
              </div>
            </template>
          </vs-tooltip>
        </card>
      </div>
      <div class="info-cards">
        <div class="info-card">
          <div class="info-card-icon"><i class='bx bx-info-circle'></i></div>
          <div class="info-card-title">課程資訊</div>
          <div class="info-data-items">
            <div class="info-data-item">
              <div class="info-data-item-title">課程標準</div>
              <div class="info-data-item-content">{{ courseData.courseType }} {{ courseStandard[courseData.courseType] }}</div>
            </div>
            <div class="info-data-item">
              <div class="info-data-item-title">人數</div>
              <div class="info-data-item-content">{{ courseData.people }} 人 </div>
            </div>
            <div class="info-data-item" v-if="courseData.peopleWithdraw > 0">
              <div class="info-data-item-title">退選</div>
              <div class="info-data-item-content">{{ courseData.peopleWithdraw }} 人 </div>
            </div>
            <div class="info-data-item">
              <div class="info-data-item-title">時數</div>
              <div class="info-data-item-content">{{ courseData.hours }} 小時</div>
            </div>
            <div class="info-data-item" v-if="courseData.stage > 1">
              <div class="info-data-item-title">階段</div>
              <div class="info-data-item-content">{{ courseData.stage }}</div>
            </div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-icon"><i class='bx bx-user'></i></div>
          <div class="info-card-title">授課資訊</div>
          <div class="info-data-items">
            <div class="info-data-item">
              <div class="info-data-item-title">教師</div>
              <div class="info-data-item-content">
                <template v-for="(name, i) of courseData.teacher.map(x => x.name)">
                  <span v-if="i > 0" :key="name + '_'">、</span>
                  <router-link
                    :to="`/teacher/${name}`"
                    class="class-link"
                    :key="name + '_'">{{ name }}</router-link>
                </template>
                <template v-if="!courseData.teacher.length">無資料</template>
              </div>
            </div>
            <div class="info-data-item">
              <div class="info-data-item-title">班級</div>
              <div class="info-data-item-content">
                <template v-for="(classItem, i) of courseData.class.map((x) => x.name)">
                  <span v-if="i > 0" :key="classItem + '_'">、</span>
                  <router-link
                    :to="`/class/${$store.state.year}/${$store.state.sem}/${classItem}?d=${$store.state.department}`"
                    class="class-link"
                    :key="classItem + '_'">{{ classItem }}</router-link>
                </template>
              </div>
            </div>
            <div class="info-data-item">
              <div class="info-data-item-title">備註</div>
              <div class="info-data-item-content" v-html="parseTextarea(courseData.notes)" />
            </div>
          </div>
        </div>
        <div class="info-card">
          <div class="info-card-icon"><i class='bx bx-map'></i></div>
          <div class="info-card-title">上課資訊</div>
          <div class="info-data-items">
            <div class="info-data-item">
              <div class="info-data-item-title">教室</div>
              <div class="info-data-item-content">{{ courseData.classroom.length ? courseData.classroom.map((x) => x.name).join('、') : '無資料' }}</div>
            </div>
            <div class="info-data-item" v-if="!parseTime(courseData.time).length">
              <div class="info-data-item-title">上課時間</div>
              <div class="info-data-item-content">尚無資訊</div>
            </div>
            <div class="info-data-item" v-for="item in parseTime(courseData.time)" :key="item.title">
              <div class="info-data-item-title">{{ item.title }}</div>
              <div class="info-data-item-content">{{ item.content }}</div>
            </div>
          </div>
        </div>
      </div>
      <h3>課程概述</h3>
      <p v-html="parseTextarea(courseData.description.zh)" />
      <p v-html="parseTextarea(courseData.description.en)" />
      <div v-if="fetchedCourseData.length">
        <vs-alert v-show="chooseClassSelect">
          <template #title>含有多項資料</template>
          本課程含有多項資料可供查詢，請使用下拉式選單選取教師來查看資料。
          <br />
          <br />
          <br />
          <vs-select label="選擇教師" v-model="chooseClassIndex" v-show="chooseClassSelect">
            <vs-option
              v-for="(item, i) in fetchedCourseData.map((x) => x.name)"
              :label="fetchedCourseData.map((x) => x.name)[i]"
              :value="i.toString()"
              :key="i">{{ item }}</vs-option>
          </vs-select>
        </vs-alert>
        <div v-for="(item, i) in fetchedCourseData" :key="i.toString()">
          <div v-show="chooseClassIndex == i.toString()">
            <div v-if="item.covid19" class="covid19-info">
              <h2>因應疫情所致之上課方式</h2>
              <p>實際實施日期與上課方式，依學校公布之訊息為主</p>
              <div class="level-block lv1">
                <div class="level-title">
                  若疫情為
                  <strong>ㄧ級</strong>警戒
                </div>
                <div class="level-content">實體授課</div>
              </div>
              <div class="level-block lv2">
                <div class="level-title">
                  若疫情為
                  <strong>二級</strong>警戒
                </div>
                <div
                  class="level-content"
                  v-if="item.covid19.lv2Method">{{ item.covid19.lv2Method }}</div>
                <div
                  class="level-content"
                  v-if="item.covid19.lv2Description"
                  v-html="parseTextarea(item.covid19.lv2Description)" />
                <div
                  class="level-content"
                  v-if="!item.covid19.lv2Method && !item.covid19.lv2Description">尚無對策</div>
              </div>
              <div class="level-block lv3">
                <div class="level-title">
                  若疫情為
                  <strong>三級</strong>警戒
                </div>
                <div class="level-content">遠距上課</div>
              </div>
              <template v-if="item.covid19.courseScoreMethod">
                <h3>評量方式</h3>
                <p v-html="parseTextarea(item.covid19.courseScoreMethod)" />
              </template>
              <template v-if="item.covid19.courseInfo">
                <h3>課程訊息公告</h3>
                <p v-html="parseTextarea(item.covid19.courseInfo)" />
              </template>
              <template v-if="item.covid19.courseURL">
                <h3>上課網址</h3>
                <p v-html="parseTextarea(item.covid19.courseURL)" />
              </template>
              <template v-if="item.covid19.contactInfo">
                <h3>學生加退選簽核及諮詢課程問題管道</h3>
                <p v-html="parseTextarea(item.covid19.contactInfo)" />
              </template>
              <template v-if="item.covid19.additionalInfo">
                <h3>補充說明資訊</h3>
                <p v-html="parseTextarea(item.covid19.additionalInfo)" />
              </template>
            </div>
            <h3>教師</h3>
            <p>{{ item.name }} {{ item.email }}</p>
            <h3>課程大綱</h3>
            <p v-html="parseTextarea(item.objective)" />
            <h3>課程進度</h3>
            <p v-html="parseTextarea(item.schedule)" />
            <h3>評量標準</h3>
            <p v-html="parseTextarea(item.scorePolicy)" />
            <h3>使用教材、參考書目或其他</h3>
            <p v-html="parseTextarea(item.materials)" />
            <div v-if="item.consultation">
              <h3>課程諮詢管道</h3>
              <p v-html="item.consultation" />
            </div>
            <template v-if="item.remarks">
              <h3>備註</h3>
              <p v-html="parseTextarea(item.remarks)" />
            </template>
            <h3>使用外文原文書籍：{{ item.foreignLanguageTextbooks ? '是' : '否' }}</h3>
            <h3>最後更新</h3>
            <p>{{ timeSince(new Date(item.latestUpdate)) }}前 <small>{{ item.latestUpdate }}</small></p>
          </div>
        </div>
      </div>

      <h3>贊助商廣告</h3>
      <adsbygoogle />
    </div>
  </div>
</template>
<style lang="sass" scoped>
.info-cards
  display: grid
  grid-template-columns: repeat(3, 1fr)
  grid-gap: 12px
  @media (max-width: 768px)
    overflow-y: auto
  .info-card
    background: rgba(var(--vs-background),1)
    color: var(--vs-text)
    border-radius: 8px
    padding: 8px 12px
    border: 1px solid rgba(var(--vs-text),.1)
    min-width: 220px
    line-height: 1.5
    .info-card-icon
      font-size: 24px
    .info-card-title
      font-size: 16px
      font-weight: bold
      margin-bottom: 8px
    .info-data-items
      @media (min-width: 769px)
        display: grid
        grid-template-columns: repeat(2, 1fr)
        gap: 8px
    .info-data-item
      @media (max-width: 768px)
        display: flex
        justify-content: space-between
        gap: 1em
      .info-data-item-title
        font-size: 14px
        font-weight: bold
        white-space: nowrap
      .info-data-item-content
        font-size: 14px
        opacity: 0.75
        @media (max-width: 768px)
          text-align: right
.covid19-info
  border-radius: 16px
  border: 1px solid rgba(var(--vs-text), .2)
  padding: 8px 16px
  background-color: rgba(var(--vs-background), 1)
  margin-top: 16px
  .level-block
    --border-color: #e6e6e6
    border-left: 4px solid var(--border-color)
    padding: 4px 8px
    margin-bottom: 8px
    &.lv1
      --border-color: rgb( 25, 91, 255)
    &.lv2
      --border-color: orange
    &.lv3
      --border-color: red
    .level-title
      font-size: 16px
    .level-content
      font-size: 14px
      opacity: .75
.class-link
  color: rgba(var(--vs-text),1)
  &:hover
    opacity: .75
  &:active
    opacity: 1
</style>
<script>
export default {
  data: () => ({
    onError: false,
    isEarlyEight: false,
    isInMyCourse: false,
    isCourseConflicted: false,
    conflictCourseData: [],
    chooseClassIndex: '0',
    chooseClassSelect: false,
    fetchedCourseData: null,
    courseData: [],
    courseStandard: {
      '○': '部訂共同必修',
      '△': '校訂共同必修',
      '☆': '共同選修',
      '●': '部訂專業必修',
      '▲': '校訂專業必修',
      '★': '專業選修'
    },
    title: '課程',
    description: '',
    withdrawalRate: null,
  }),
  created() {
    this.fetchData()
  },
  head() {
    return {
      title: this.title,
      meta: [
        { hid: 'og:title', name: 'og:title', content: this.title },
        { hid: 'og:description', name: 'og:description', content: this.description },
        { hid: 'description', name: 'description', content: this.description }
      ]
    }
  },
  methods: {
    async fetchData() {
      let courseId = this.$route.params.id
      let { year, sem } = this.$route.params
      const loading = this.$vs.loading()
      try {
        let course = await this.$fetchCourse(year, sem)
        let courseNumber = [`𝟬`, `𝟭`, `𝟮`, `𝟯`, `𝟰`, `𝟱`, `𝟲`, `𝟳`, `𝟴`, `𝟵`]
        let parsedCourseId = courseId.split('').map((c) => courseNumber[c]).join('')
        this.courseData = course.filter(x => x.id == courseId)[0]
        this.description = this.courseData.description.zh
        this.title = `${parsedCourseId} ${this.courseData.name.zh}`
        this.checkCourseInMyCourse()
        this.checkIsCourseConflict()
        this.fetchedCourseData = await fetch(
          `https://gnehs.github.io/ntut-course-crawler-node/${year}/${sem}/course/${courseId}.json`
        ).then(x => x.json())
        if (this.fetchedCourseData.length > 1) {
          this.chooseClassSelect = true
        }

        let withdrawalRate = await this.$getWithdrawalRate()
        let calcedWithdrawalRate = Math.max(...this.fetchedCourseData.map(x => x.name).map(x => withdrawalRate[x] ?? null).filter(x => x), -1)
        this.withdrawalRate = calcedWithdrawalRate > 0 ? calcedWithdrawalRate : null
      } catch (e) {
        this.onError = e
        loading.close()
      }
      loading.close()
    },
    parseTextarea(t) {
      t = t.replace(/\t/g, '　　')
      t = t.replace(/\n/g, '<br/>')
      return t
    },
    parseTime(t) {
      let result = []
      let eng2zh = { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }
      for (let i of Object.entries(t)) {
        if (i[1].length) {
          if (i[1].includes('1')) this.isEarlyEight = true
          result.push({ title: eng2zh[i[0]], content: i[1].join('、') })
        }
      }
      return result
    },
    checkCourseInMyCourse() {
      this.isInMyCourse = this.$checkIsInCourse(this.courseData.id)
    },
    async checkIsCourseConflict() {
      let { year, sem } = this.$route.query
      let conflictCourseIds = await this.$checkConflictedCourse([this.courseData], true)
      for (let course of await this.$fetchCourse(year, sem)) {
        if (conflictCourseIds.includes(course.id) && course.id != this.courseData.id) {
          this.conflictCourseData.push(course)
        }
      }
      this.isCourseConflicted = conflictCourseIds.length > 0
    },
    add2myCourse() {
      this.$addCourse(this.courseData.id)
      this.isInMyCourse = true
      this.$vs.notification({
        title: '加入完成！',
        text: `已將「${this.courseData.name.zh}」加入到我的課程`
      })
    },
    removeFromMyCourse() {
      this.$removeCourse(this.courseData.id)
      this.isInMyCourse = false
      this.$vs.notification({
        title: '已移除',
        text: `已將「${this.courseData.name.zh}」從我的課程中移除`
      })
    },

    timeSince(date) {
      let seconds = Math.floor((new Date() - date) / 1000)
      let interval = seconds / 31536000

      if (interval > 1) {
        return Math.floor(interval) + ' 年'
      }
      interval = seconds / 2592000
      if (interval > 1) {
        return Math.floor(interval) + ' 月'
      }
      interval = seconds / 86400
      if (interval > 1) {
        return Math.floor(interval) + ' 天'
      }
      interval = seconds / 3600
      if (interval > 1) {
        return Math.floor(interval) + ' 小時'
      }
      interval = seconds / 60
      if (interval > 1) {
        return Math.floor(interval) + ' 分鐘'
      }
      return Math.floor(seconds) + ' 秒'
    },
  }
}
</script>
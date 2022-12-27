<template>
  <div>
    <div class="header">
      <div class="department" @click="$openDatasetDialog"> {{ $store.state.department == 'main' ? '日間部' : $store.state.department }}</div>
      <div class="title"> {{ `${$store.state.year} 年${$store.state.sem == '1' ? '上' : '下'}學期` }}</div>
    </div>
    <universal-search class="universal-search" />
    <upcoming-course />
    <h2>課程</h2>
    <vs-alert>
      <template #title>進階搜尋大更新！</template>
      新增了多種篩選器，也可以更輕鬆的設定各種條件，此外博雅與體育搜尋也移到「進階搜尋」頁面了。
    </vs-alert>
    <div class="cards">
      <card
        class="hoverable padding"
        :to="`/advanced-search?year=${$store.state.year}&sem=${$store.state.sem}&d=${$store.state.department}`">
        <card-title>進階搜尋</card-title>
        <p>依條件搜尋課程</p>
        <i class="bx bx-search"></i>
      </card>
      <card class="hoverable padding" to="/class">
        <card-title>班級課表</card-title>
        <p>查看各班上課時間表</p>
        <i class="bx bx-time"></i>
      </card>
      <card class="hoverable padding" to="/my-course">
        <card-title>我的課程</card-title>
        <p>查看已儲存的課程</p>
        <i class="bx bx-user"></i>
      </card>
    </div>

    <h2>實用</h2>
    <div class="cards">
      <card class="hoverable padding" :to="standardURL">
        <card-title>課程標準</card-title>
        <p>查看各系所畢業標準等相關資訊</p>
        <i class="bx bxs-graduation"></i>
      </card>
      <card class="hoverable padding" to="/emptyroom">
        <card-title>尋找空教室</card-title>
        <p>查看沒有課程進行的教室</p>
        <i class="bx bx-ghost"></i>
      </card>
      <card class="hoverable padding" to="/withdrawal">
        <card-title>退選率</card-title>
        <p>查看所有教師的退選率</p>
        <i class="bx bx-user-x"></i>
      </card>
      <card class="hoverable padding" :to="`/widget?year=${$store.state.year}`">
        <card-title>iOS 小工具</card-title>
        <p>在桌面上檢視接下來的課程</p>
        <i class="bx bx-extension"></i>
      </card>
      <card class="hoverable padding" :to="`/calendar?year=${$store.state.year}`">
        <card-title>新增課程到行事曆</card-title>
        <p>將我的課程匯入至行事曆</p>
        <i class='bx bx-calendar-plus'></i>
      </card>
    </div>

    <h2>其他</h2>
    <div class="cards">
      <card class="hoverable padding" to="/doc">
        <card-title>文件</card-title>
        <p>API 文件與嵌入頁面相關功能介紹與說明</p>
        <i class="bx bx-file"></i>
      </card>
      <card class="hoverable padding" to="/changelog">
        <card-title>更新日誌</card-title>
        <p>查看本站最近的更新日誌</p>
        <i class='bx bx-history'></i>
      </card>
      <card class="hoverable padding" to="/about">
        <card-title>關於</card-title>
        <p>關於本網站</p>
        <i class="bx bx-info-circle"></i>
      </card>
      <card class="hoverable padding" to="/privacy">
        <card-title>隱私權政策</card-title>
        <p>隱私權政策</p>
        <i class="bx bx-info-circle"></i>
      </card>
      <card class="hoverable padding" to="/status">
        <card-title>擷取狀態</card-title>
        <p>查看爬蟲資料擷取狀態</p>
        <i class="bx bx-terminal"></i>
      </card>
    </div>

    <h2>贊助商廣告</h2>
    <adsbygoogle />

    <p style="text-align: center;font-size: .75em;opacity: .75;">
      本站資料擷取自
      <a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a>，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
    </p>
  </div>
</template>

<script>
import universalSearch from '~/components/universal-search.vue'
export default {
  components: { universalSearch },
  data: () => ({
    standardURL: `/standard`
  }),
  created() {
    if (localStorage[`data-standard-query`]) {
      let query = JSON.parse(localStorage[`data-standard-query`])
      this.standardURL = `/standard?year=${query.year}&system=${query.system}&department=${query.department}`
    }
  },
  methods: {}
}
</script>
<style lang="sass" scoped>
.header
  font-size: 32px
  margin-bottom: 16px
  .title
    font-weight: bold
  .department
    color: rgba(var(--vs-text), .75)
    font-weight: 400
    font-size: .5em
    display: inline-block
    border-radius: 100em
    padding: .25em .75em
    border: 1px solid rgba(var(--vs-text), .25)
    cursor: pointer
    &:hover
      background-color: rgba(var(--vs-text), .05)
    &:active
      background-color: rgba(var(--vs-text), .1)
.universal-search
  display: none
  @media screen and (max-width: 900px)
    display: block
</style>
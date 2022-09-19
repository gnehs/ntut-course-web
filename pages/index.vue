<template>
  <div>
    <h1>
      {{ `${$store.state.year} 年${$store.state.sem == '1' ? '上' : '下'}學期` }} -
      {{ $store.state.department == 'main' ? '日間部' : $store.state.department }}
    </h1>
    <p>
      本站資料擷取自
      <a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a>，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
    </p>
    <upcoming-course />
    <h2>課程資源</h2>
    <div class="cards">
      <card
        class="hoverable padding"
        :to="`/search?year=${$store.state.year}&sem=${$store.state.sem}&d=${$store.state.department}`">
        <card-title>搜尋課程</card-title>
        <p>依課號、關鍵字或教師搜尋課程</p>
        <i class="bx bx-search"></i>
      </card>
      <card
        class="hoverable padding"
        :to="`/search?year=${$store.state.year}&sem=${$store.state.sem}&d=${$store.state.department}&classroom=^博雅`">
        <card-title>博雅課程</card-title>
        <p>透過篩選器來篩選特定類別的博雅</p>
        <i class="bx bx-library"></i>
      </card>
      <card
        class="hoverable padding"
        :to="`/search?year=${$store.state.year}&sem=${$store.state.sem}&d=${$store.state.department}&classroom=體育`">
        <card-title>體育課</card-title>
        <p>查看本學期開設之所有體育課</p>
        <i class="bx bx-football"></i>
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

    <h2>實用工具</h2>
    <div class="cards">
      <card class="hoverable padding" :to="standardURL">
        <card-title>課程標準</card-title>
        <p>查看各系所畢業學分等資訊</p>
        <i class="bx bxs-graduation"></i>
      </card>
      <card class="hoverable padding" to="/emptyroom">
        <card-title>尋找空教室</card-title>
        <p>尋找沒有課程進行的教室</p>
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
        <card-title>新增到行事曆</card-title>
        <p>將我的課程匯入至行事曆</p>
        <i class="bx bx-calendar"></i>
      </card>
    </div>

    <h2>其他資源</h2>
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
  </div>
</template>

<script>
export default {
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
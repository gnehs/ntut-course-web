<template>
  <div>
    <vs-alert :page.sync="alertPage">
      <template #title>歡迎使用</template>

      <template #page-1>
        本站資料擷取自
        <a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a
        >，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
      </template>
      <template #page-2
        >你可以點選右上方的學期按鈕來切換檢視的學制與學期，目前顯示的資料為
        {{ `${$store.state.year} 年${$store.state.sem == '1' ? '上' : '下'}學期` }}，{{
          $store.state.department == 'main' ? '日間部' : $store.state.department
        }}。</template
      >
    </vs-alert>
    <br />
    <div class="cards">
      <card class="hoverable padding" :to="`/search?year=${$store.state.year}&sem=${$store.state.sem}&d=${$store.state.department}`">
        <card-title>搜尋課程</card-title>
        <p>依課號、關鍵字或教師搜尋課程</p>
        <i class="bx bx-search"></i>
      </card>
      <card class="hoverable padding" to="/class">
        <card-title>班級課表</card-title>
        <p>查看各班上課時間表</p>
        <i class="bx bx-time"></i>
      </card>
      <card class="hoverable padding" to="/standard">
        <card-title>課程標準</card-title>
        <p>查看各系所畢業學分等資訊</p>
        <i class="bx bxs-graduation"></i>
      </card>
      <card class="hoverable padding" to="/my-course">
        <card-title>我的課程</card-title>
        <p>查看已儲存的課程</p>
        <i class="bx bx-user"></i>
      </card>
      <card class="hoverable padding" to="/api">
        <card-title>API 文件</card-title>
        <p>探索開放公眾使用的 API 文件</p>
        <i class="bx bx-data"></i>
      </card>
      <card class="hoverable padding" to="/about">
        <card-title>關於</card-title>
        <p>關於本網站</p>
        <i class="bx bx-info-circle"></i>
      </card>
    </div>
  </div>
</template>
  
<script>
export default {
  data: () => ({
    alertPage: 1
  }),
  created() {},
  methods: {}
}
</script> 
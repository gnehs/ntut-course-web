<template>
  <div>
    <h1>關於</h1>
    <p>
      本網站與爬蟲由
      <a href="https://gnehs.net" target="_blank">勝勝</a> 開發。
    </p>
    <h2>功能</h2>
    <ul>
      <li>快速響應的搜尋功能</li>
      <li>提供隱藏衝堂課程選項</li>
      <li>記錄課程供選課參考</li>
      <li>
        提供
        <router-link to="/doc">API</router-link>
        <span>供公眾使用</span>
      </li>
      <li>比學校網站更為精細的時間表篩選</li>
    </ul>
    <h2>開發動機</h2>
    <p>由於學校課程系統對人類不友善，我希望能有美觀介面與快速響應的課程系統，便製作了此網站。</p>
    <h2>技術細節</h2>
    <p>
      本站資料擷取自
      <a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a>，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。 <br />若資料有問題或有任何建議，歡迎於
      GitHub 提出 Issue 或發送 Pull
      Request。
      <br />
      <br />網站：
      <a href="https://github.com/gnehs/ntut-course-web" target="_blank">https://github.com/gnehs/ntut-course-web</a>
      <br />爬蟲：
      <a href="https://github.com/gnehs/ntut-course-crawler-node" target="_blank">https://github.com/gnehs/ntut-course-crawler-node</a>
    </p>
    <h2>聯絡開發者</h2>
    <p>若對北科好朋友有任何建議或找到 Bug，請聯繫 ntut-course-web[at]gnehs.net（請將 [at] 替換為 @），或在 <a href="https://github.com/gnehs/ntut-course-web"
        target="_blank">GitHub</a> 上發 issue。</p>
    <h2>Special Thanks</h2>

    <ul>
      <li>
        <a href="https://nuxtjs.org/" target="_blank">Nuxt.js</a>
      </li>
      <li>
        <a href="https://vuesax.com/" target="_blank">Vuesax</a>
      </li>
      <li>
        <a href="https://vuejs.org/" target="_blank">Vue.js</a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  head() {
    return {
      title: '關於'
    }
  }
}
</script>
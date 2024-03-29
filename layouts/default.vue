<template>
  <div id="app">
    <vs-navbar
      center-collapsed
      v-model="active"
      shadow
      fixed
      not-line
      v-if="!isIframe && !isAdvancedSearch"
    >
      <template #left>
        <router-link
          to="/"
          class="site-title"
          @click="trackBtn('nav_logo_click')"
          >🍤 北科課程好朋友
        </router-link>
      </template>
      <universal-search navbar />
      <template #right>
        <vs-button
          @click="
            datasetDialog = true;
            trackBtn('nav_dataset_click');
          "
          :disabled="Boolean($route.query.year)"
          >{{ parseYearSemVal(yearSemVal) }}</vs-button
        >
      </template>
    </vs-navbar>
    <div :class="{ container: !isAdvancedSearch, isIframe }">
      <Nuxt />
    </div>
    <div class="text-footer" v-if="isIframe && !isAdvancedSearch">
      本資料由
      <a href="https://ntut-course.gnehs.net/" target="_blank"
        >北科課程好朋友</a
      >
      提供
    </div>
    <footer id="footer" v-if="!isIframe && !isAdvancedSearch">
      <div class="lr-container nowrap">
        <div class="l">
          Developed by
          <a href="https://gnehs.net" target="_blank" style="margin-left: 0.2em"
            >勝勝</a
          >
        </div>
        <div class="r">
          <vs-button
            icon
            transparent
            href="https://github.com/gnehs/ntut-course-web"
            blank
          >
            <i class="bx bxl-github"></i>
          </vs-button>
        </div>
      </div>
    </footer>
    <vs-dialog v-model="datasetDialog">
      <template #header>
        <h4>選擇資料集</h4>
      </template>
      <div class="datasetDialog-form">
        <vs-select
          v-model="yearSemVal"
          @change="datasetSelected"
          v-if="yearSemItems"
          label="學期"
        >
          <vs-option label="選擇學期" value="no" disabled>選擇學期</vs-option>
          <vs-option
            v-for="(item, i) in yearSemItems"
            :label="parseYearSemVal(item)"
            :value="item"
            :key="i"
          >
            {{ parseYearSemVal(item) }}
          </vs-option>
        </vs-select>
        <br />
        <vs-select
          v-model="departmentVal"
          @change="datasetSelected"
          label="學制"
        >
          <vs-option label="選擇學制" value="no" disabled>選擇學制</vs-option>
          <vs-option
            v-for="(item, i) in departmentItems"
            :label="item"
            :value="i"
            :key="i"
            >{{ item }}</vs-option
          >
        </vs-select>
      </div>
      <template #footer>
        <div class="datasetDialog-footer">
          <vs-button block @click="datasetDialog = false">完成</vs-button>
        </div>
      </template>
    </vs-dialog>
  </div>
</template>
<script>
import Vue from "vue";
import pako from "pako";
export default {
  data: () => ({
    active: "/",
    yearSemItems: null,
    yearSemVal: "-1",
    departmentItems: ["日間部", "進修部", "研究所(日間部、進修部、週末碩士班)"],
    departmentVal: 0,
    datasetDialog: false,
    isIframe: false,
    isMobile: false,
  }),
  computed: {
    isAdvancedSearch() {
      return this.$route.name == "advanced-search" && !this.isMobile;
    },
  },
  mounted() {
    if (localStorage["data-department"] != "main") {
      this.departmentVal = this.departmentItems.indexOf(
        localStorage["data-department"]
      );
    }
  },
  async created() {
    // check isIframe by query string
    if (this.$route.query.mode == "iframe") {
      this.isIframe = true;
    }
    // openDatasetDialog
    Vue.prototype.$openDatasetDialog = () => {
      this.datasetDialog = true;
    };
    // clear google adsence injected style
    setInterval(() => {
      try {
        document.getElementById(`app`).style = "";
      } catch (e) {}
    }, 1000);
    // watch isMobile
    const mobileMediaQuery = window.matchMedia("(max-width: 768px)");
    this.isMobile = mobileMediaQuery.matches;
    mobileMediaQuery.addListener((e) => {
      this.isMobile = e.matches;
    });
    // detect dark mode
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    themeSwitch(darkModeMediaQuery.matches);
    darkModeMediaQuery.addListener((e) => {
      const darkModeOn = e.matches;
      themeSwitch(darkModeOn);
    });
    function themeSwitch(darkModeOn) {
      document.body.setAttribute("vs-theme", darkModeOn ? "dark" : "light");
    }
    String.prototype.trimEllip = function (length) {
      return this.length > length ? this.substring(0, length) + "..." : this;
    };
    // localforage
    this.$vlf.config({
      name: "ntut-course",
      version: 1.0,
      storeName: "course_compressed",
      description: "course data",
    });
    // load all items to memory
    window.$ntutCourse = {};
    this.$vlf.iterate((_, key) => {
      this.$getStore(key);
    });
    Vue.prototype.$getStore = async (key) => {
      if (window.$ntutCourse[key]) {
        return window.$ntutCourse[key];
      }
      let data = await this.$vlf.getItem(key);
      if (!data) {
        return null;
      }
      data = pako.inflate(data, { level: 6 });
      data = JSON.parse(new TextDecoder("utf-8").decode(data));
      if (data.expiration < Date.now()) {
        return null;
      }
      window.$ntutCourse[key] = data.data;
      return data.data;
    };
    Vue.prototype.$setStore = async (key, value, expiration = 1) => {
      window.$ntutCourse[key] = value;
      let data = {
        expiration: new Date().getTime() + expiration * 24 * 60 * 60 * 1000,
        data: value,
      };
      data = new TextEncoder().encode(JSON.stringify(data));
      data = pako.deflate(data, { level: 6 });
      return await this.$vlf.setItem(key, data);
    };
    Vue.prototype.$cleanStore = async () => {
      window.$ntutCourse = {};
      return await this.$vlf.clear();
    };
    Vue.prototype.$fetchCourse = async (y, s, department, commit = true) => {
      //replace yr & sem if query seleted
      let { year, sem, d } = this.$route.query;
      if (year && sem && d) {
        y = year;
        s = sem;
        department = d;
      }
      if (!y || !s) {
        let yearData = await this.$fetchYearData();
        // trying get from localStorage
        if (localStorage["data-year"] && localStorage["data-sem"]) {
          y = localStorage["data-year"];
          s = localStorage["data-sem"];
        } else {
          let yrs = Object.keys(yearData);
          y = yrs[yrs.length - 1];
          s = yearData[y].length;
        }
      }
      if (!department) {
        department = localStorage["data-department"] || "main";
        this.departmentVal = this.departmentItems.indexOf(department);
        if (this.departmentVal == -1) this.departmentVal = 0;
      }
      this.yearSemVal = `${y}-${s}`;
      let dataKey = `course_${y}_${s}_${department}`;

      let loading;
      try {
        let result = await this.$getStore(dataKey);
        if (!result) {
          loading = this.$vs.loading({
            text: "下載課程清單...",
          });
          result = await fetch(
            `https://gnehs.github.io/ntut-course-crawler-node/${y}/${s}/${department}.json`
          ).then((x) => x.json());
          await this.$setStore(dataKey, result);
          loading.close();
        }
        if (commit) {
          this.$store.commit("updateYear", y);
          this.$store.commit("updateSem", s);
          this.$store.commit("updateDepartment", department);
        }
        return result;
      } catch (e) {
        this.$vs.notification({
          title: "擷取資料時發生了錯誤",
          text: e,
          color: "danger",
        });
        loading.close();

        this.$store.commit("updateYear", "112");
        this.$store.commit("updateSem", "1");
        this.$store.commit("updateDepartment", "main");
      }
    };
    Vue.prototype.$fetchYearData = async () => {
      let key = `main_year`;
      try {
        let res = await fetch(
          `https://gnehs.github.io/ntut-course-crawler-node/main.json`
        ).then((x) => x.json());
        sessionStorage[key] = JSON.stringify(res);
        return JSON.parse(sessionStorage[key]);
      } catch (e) {
        this.$vs.notification({
          title: "擷取資料時發生了錯誤",
          text: e,
          color: "danger",
        });
      }
    };
    Vue.prototype.$checkIsInCourse = (id) => {
      let { year, sem } = this.$store.state;
      let myCourseKey = `my-couse-data-${year}-${sem}`;
      let myCourseData = JSON.parse(localStorage[myCourseKey] || "[]");
      return Boolean(myCourseData.includes(id));
    };
    Vue.prototype.$checkConflictedCourse = async (
      courses,
      pushMyCourse = false
    ) => {
      let { year, sem } = this.$store.state;
      // get my course
      let myCourseKey = `my-couse-data-${year}-${sem}`;
      let myCourseData = JSON.parse(localStorage[myCourseKey] || "[]");
      let myCourses = (await this.$fetchCourse(year, sem)).filter((x) =>
        myCourseData.includes(x.id)
      );

      function checkConflict(a, b) {
        for (let i of Object.entries(a.time)) {
          for (let j of i[1]) {
            if (b.time[i[0]].includes(j)) {
              return true;
            }
          }
        }
        return false;
      }

      let conflictCourseIds = [];
      for (let dataCourse of courses) {
        for (let myCourse of myCourses) {
          if (
            checkConflict(dataCourse, myCourse) &&
            dataCourse.id != myCourse.id
          ) {
            let pushId = pushMyCourse ? myCourse.id : dataCourse.id;
            if (!conflictCourseIds.includes(pushId)) {
              conflictCourseIds.push(pushId);
            }
          }
        }
      }
      return conflictCourseIds;
    };
    Vue.prototype.$addCourse = (id) => {
      let { year, sem } = this.$store.state;
      let myCourseKey = `my-couse-data-${year}-${sem}`;
      let myCourseData = JSON.parse(localStorage[myCourseKey] || "[]");
      if (!myCourseData.includes(id)) {
        myCourseData.push(id);
      }
      localStorage[myCourseKey] = JSON.stringify(myCourseData);
    };
    Vue.prototype.$removeCourse = (id) => {
      let { year, sem } = this.$store.state;
      let myCourseKey = `my-couse-data-${year}-${sem}`;
      let myCourseData = JSON.parse(localStorage[myCourseKey] || "[]");
      myCourseData = myCourseData.filter((x) => x != id);
      localStorage[myCourseKey] = JSON.stringify(myCourseData);
    };
    Vue.prototype.$getWithdrawalRate = async () => {
      let res = await this.$getStore("withdrawalRate");
      if (!res) {
        res = await fetch(
          `https://gnehs.github.io/ntut-course-crawler-node/analytics/withdrawal-rate.json`
        ).then((x) => x.json());
        await this.$setStore("withdrawalRate", res, 30);
      }
      return res;
    };
    await this.initYearSem();
    await this.$fetchCourse();
    this.$router.beforeEach((to, from, next) => {
      this.active = to.path;
      next();
    });
    // detect firefox private mode
    try {
      let req = indexedDB.open("ntut-course");
      req.onerror = () => {
        this.$vs.notification({
          sticky: true,
          title: "無法使用 IndexedDB",
          text: "這可能會造成部分功能無法如常運作，若你正使用 Firefox 且開啟了隱私模式，請關閉隱私模式或使用其他瀏覽器。",
          color: "danger",
          duration: 1000 * 60 * 60 * 24,
        });
      };
      req.onsuccess = () => {
        req.result.close();
      };
    } catch (e) {}
  },
  methods: {
    trackBtn(e = "toggle_table_view") {
      try {
        window.gtag("event", e);
      } catch (e) {}
    },
    async initYearSem() {
      let d = await this.$fetchYearData();
      let res = [];
      for (let year of Object.keys(d).reverse()) {
        for (let sem of d[year].reverse()) {
          res.push(`${year}-${sem}`);
        }
      }
      this.yearSemItems = res;
      this.departmentVal = res[0];
    },
    parseYearSemVal(v) {
      let s = v.split("-");
      return `${s[0]} 年${s[1] == "1" ? "上" : "下"}學期`;
    },
    datasetSelected() {
      let s = this.yearSemVal.split("-");
      let department = this.departmentItems[this.departmentVal];
      if (this.departmentVal == 0) {
        department = "main";
      }

      this.$fetchCourse(s[0], s[1], department);
    },
  },
};
</script>
<style lang="sass">
#app
  display: flex
  flex-direction: column
  min-height: 100vh
  .container
    flex: 1
    width: 1024px
    max-width: 97%
    margin: 0 auto
    &:not(.isIframe)
      padding-top: 74px
  .text-footer
    text-align: center
    font-size: .75em
    margin: 16px 0
    opacity: .75
  #footer
    margin: 0 auto
    margin-top: 10px
    text-align: center
    font-size: .85rem
    opacity: .7
    padding: 0 15px
    width: 100%
    background: rgba(var(--vs-background), 1)
    border-radius: 15px 15px 0px 0px
    box-shadow: 0px 5px 25px 0px rgba(0, 0, 0, var(--vs-shadow-opacity))
.datasetDialog-form
  .vs-select-content
    max-width: 100%
</style>

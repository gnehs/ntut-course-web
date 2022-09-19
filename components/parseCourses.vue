<template>
  <div v-if="courses">
    <div class="center">
      <vs-button flat :active="layout == 'table'" @click="layout = 'table';trackBtn()">
        <i class="bx bx-table"></i>表格
      </vs-button>
      <vs-button flat :active="layout == 'card'" @click="layout = 'card'">
        <i class="bx bx-card"></i>卡片
      </vs-button>
      <vs-button
        flat
        :active="layout == 'timetable'"
        @click="layout = 'timetable'"
        v-if="showTimetable">
        <i class="bx bx-time"></i>課表
      </vs-button>
    </div>
    <div v-if="layout == 'card'">
      <transition-group name="flip-card" tag="div" class="cards">
        <card
          class="hoverable padding"
          v-for="tr in $vs.getPage(showConflictCourse ? courses : courses.filter((x) => !conflictCourseData.includes(x.id)), page, max)"
          :key="tr.id"
          :to="`/course/${$store.state.year}/${$store.state.sem}/${tr.id}`">
          <card-title space-between>
            <sports-title :course-data="tr" v-if="tr.class.some(x => x.name.match(/體育/))" />
            <span v-else>{{ tr.courseType }}{{ tr.name.zh }}</span>
            <tag v-if="conflictCourseData.includes(tr.id)" color="red">
              <i class="bx bxs-error"></i>衝堂
            </tag>
          </card-title>
          <general-tags :course-data="tr" />

          <div class="cards">
            <card class="borderless">
              <card-title>{{ tr.id }}</card-title>
              <p>課號</p>
            </card>
            <card class="borderless">
              <card-title>{{ tr.credit }}</card-title>
              <p>學分</p>
            </card>
            <card v-for="item in parseTime(tr.time)" :key="item.title" class="borderless">
              <card-title>{{ item.content }}</card-title>
              <p>{{ item.title }}</p>
            </card>
            <card v-if="!parseTime(tr.time).length" class="borderless">
              <card-title>無資料</card-title>
              <p>上課時間</p>
            </card>
          </div>
          <p>
            班級：{{
            tr.class
            .map((x) => x.name)
            .join('、')
            .trimEllip(9)
            }}
            <br />
            教師：{{
            tr.teacher
            .map((y) => y.name)
            .join('、')
            .trimEllip(13)
            }}
            <br />
            備註：{{ tr.notes.trimEllip(15) }}
          </p>
        </card>
      </transition-group>
      <div class="center">
        <p v-if="!courses.length">查無資料</p>
      </div>
      <br />
      <vs-pagination
        v-model="page"
        :length="$vs.getLength(showConflictCourse ? courses : courses.filter((x) => !conflictCourseData.includes(x.id)), max)" />
    </div>
    <card style="padding: 0" v-if="layout == 'table'">
      <vs-table striped>
        <template #thead>
          <vs-tr>
            <vs-th>課號</vs-th>
            <vs-th>課程名稱</vs-th>
            <vs-th>教師</vs-th>
            <vs-th>班級</vs-th>
            <vs-th>備註</vs-th>
          </vs-tr>
        </template>
        <template #tbody>
          <vs-tr
            :key="tr.id"
            v-for="tr in $vs.getPage(showConflictCourse ? courses : courses.filter((x) => !conflictCourseData.includes(x.id)), page, max)"
            @click="$router.push(`/course/${$store.state.year}/${$store.state.sem}/${tr.id}`)"
            style="cursor: pointer"
            :data="tr">
            <vs-td>{{ tr.id }}</vs-td>
            <vs-td>{{ tr.courseType }}{{ tr.name.zh }}</vs-td>
            <vs-td>
              {{
              tr.teacher
              .map((y) => y.name)
              .join('、')
              .trimEllip(9)
              }}
            </vs-td>
            <vs-td>
              {{
              tr.class
              .map((x) => x.name)
              .join('、')
              .trimEllip(9)
              }}
            </vs-td>
            <vs-td>
              <span style="color: red" v-if="conflictCourseData.includes(tr.id)">衝堂</span>
              <span v-else>{{ tr.notes }}</span>
            </vs-td>
          </vs-tr>
        </template>
        <template #footer>
          <vs-pagination
            v-model="page"
            :length="$vs.getLength(showConflictCourse ? courses : courses.filter((x) => !conflictCourseData.includes(x.id)), max)" />
        </template>
        <template #notFound>
          <p
            v-if="!(showConflictCourse ? courses : courses.filter((x) => !conflictCourseData.includes(x.id))).length">查無資料</p>
        </template>
      </vs-table>
    </card>
    <card style="padding: 0; overflow: hidden" v-if="layout == 'timetable'">
      <div class="timetable">
        <div class="header">
          <div class="item"></div>
          <div class="item">一</div>
          <div class="item">二</div>
          <div class="item">三</div>
          <div class="item">四</div>
          <div class="item">五</div>
        </div>
        <div class="content" v-for="time in timetable" :key="time">
          <div class="item">{{ time }}</div>
          <div class="item" v-for="date in Object.keys(dateEng2zh).slice(1, 5 + 1)" :key="date">
            <template
              v-if="$vs.getPage(courses, page, max).filter((x) => x.time[date].includes(time)).length <= 2">
              <router-link
                class="course"
                :class="{ conflict: conflictCourseData.includes(item.id) }"
                v-for="item in $vs
                .getPage(showConflictCourse ? courses : courses.filter((x) => !conflictCourseData.includes(x.id)), page, max)
                .filter((x) => x.time[date].includes(time))"
                :key="item.id"
                :to="`/course/${$store.state.year}/${$store.state.sem}/${item.id}`">{{ item.name.zh }}</router-link>
            </template>
            <template v-else>
              <div class="course">課程數量過多無法顯示</div>
            </template>
          </div>
        </div>
      </div>
    </card>
    <br />
    <br />
    <br />
  </div>
</template>
<script>
import card from './card.vue'
import SportsTitle from './sportsTitle.vue'
export default {
  components: { card, SportsTitle },
  name: 'parse-courses',
  props: {
    courses: Array,
    showTimetable: {
      type: Boolean,
      default: false
    },
    showConflictCourse: {
      type: Boolean,
      default: true
    }
  },
  data: () => ({
    layout: 'card',
    max: 50,
    page: 1,
    conflictCourseData: [],
    timetable: ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C'],
    dateEng2zh: { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }
  }),
  mounted() {
    this.checkIsCourseConflict()
    if (this.$route.query.layout) this.layout = this.$route.query.layout
    if (this.$route.query.page) this.page = this.$route.query.page
  },
  watch: {
    courses(newCount, oldCount) {
      this.checkIsCourseConflict()
    },
    page(newPage, oldPage) {
      let query = Object.assign({}, this.$route.query)
      query.page = newPage
      this.$router.replace({ query }, () => { })
    },
    layout(newLayout, oldLayout) {
      let query = Object.assign({}, this.$route.query)
      query.layout = newLayout
      this.$router.replace({ query }, () => { })
    }
  },
  methods: {
    trackBtn() {
      window.gtag('event', 'toggle_table_view')
    },
    parseTime(t) {
      let result = []
      for (let i of Object.entries(t)) {
        if (i[1].length) result.push({ title: this.dateEng2zh[i[0]], content: i[1].join('、') })
      }
      return result
    },
    async checkIsCourseConflict() {
      this.conflictCourseData = await this.$checkConflictedCourse(this.courses)
      let length = this.$vs.getLength(
        this.showConflictCourse ? this.courses : this.courses.filter(x => !this.conflictCourseData.includes(x.id)),
        this.max
      )
      if (this.page > length) this.page = 1
    }
  }
}
</script>
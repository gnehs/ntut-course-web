<template>
  <div v-if="years">
    <h1>課程標準</h1>
    <vs-alert v-show="onError">
      <template #title>發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>
    <template v-if="year">
      <h3>
        已選擇的項目
        <span style="font-size: 0.8em; opacity: 0.7; font-weight: normal">點擊來取消</span>
      </h3>

      <div class="cards" style="--card-row: 5; --card-row-sm: 3">
        <card class="hoverable padding" @click.native="year = null" :disabled="system">
          <card-title>{{ year }}</card-title>
          <p>年</p>
        </card>
        <card class="hoverable padding" @click.native="system = null" v-if="system" :disabled="department">
          <card-title>{{ system }}</card-title>
          <p>學制</p>
        </card>
        <card class="hoverable padding" @click.native="department = null" v-if="department">
          <card-title>{{ department }}</card-title>
          <p>學制</p>
        </card>
      </div>
    </template>
    <template v-if="!year">
      <h3>選擇入學年度</h3>
      <div class="list">
        <div class="item" v-for="item of years" :key="item" @click="year = item">
          {{ item }}
        </div>
      </div>
    </template>
    <template v-if="standardData">
      <template v-if="!system && year">
        <h3>選擇學制</h3>
        <div class="list">
          <div class="item" v-for="item of Object.keys(standardData)" :key="item" @click="system = item">
            {{ item }}
          </div>
        </div>
      </template>
      <template v-if="system && !department">
        <h3>選擇系所</h3>
        <div class="list">
          <div
            class="item"
            v-for="item of Object.keys(standardData[system])
              .sort((a, b) => a.localeCompare(b))
              .sort((a, b) => a.length - b.length)"
            :key="item"
            @click="department = item"
          >
            {{ item }}
          </div>
        </div>
      </template>
      <template v-if="department && currentDepartment">
        <h3>{{ department }}</h3>
        <div class="cards" style="--card-row: 5; --card-row-sm: 3">
          <card v-for="item of Object.entries(currentDepartment.credits)" :key="item[0]">
            <card-title>{{ item[1] }}</card-title>
            <p>{{ item[0] }}</p>
          </card>
        </div>
        <h3>相關規定事項</h3>
        <ul>
          <li v-for="item of currentDepartment.rules" :key="item">{{ item }}</li>
        </ul>
        <h3>課程</h3>
        <div v-for="[year, yearData] of Object.entries(currentDepartment.courses)" :key="year" class="course-items">
          <div v-for="[sem, items] of Object.entries(yearData)" :key="sem" class="course-item">
            <h4>{{ year }} 年級{{ sem == '1' ? '上' : '下' }}學期</h4>
            <div class="list">
              <div class="item" v-for="item of items" :key="item.name" style="display: flex; justify-content: space-between">
                <span> {{ item.type }} {{ item.name }} </span>
                <span> {{ item.credit }} 學分</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template> 
<style lang="sass" scoped>
.course-items
  display: flex
  flex-wrap: wrap
  gap: 1rem
  margin-bottom: 1rem
  @media (max-width: 768px)
    flex-direction: column
  .course-item
    flex: 1
</style>
<script>
export default {
  async created() {
    this.fetchYearsData()
    if (this.year) {
      await this.fetchYearData(this.year)
    }
    if (this.system && this.department) {
      this.parseDepartmentData(this.standardData[this.system][this.department])
    }
  },
  data: () => ({
    onError: null,
    years: null,
    standardData: null,
    currentDepartment: null
  }),
  head() {
    return {
      title: '課程標準'
    }
  },
  computed: {
    year: {
      get: function() {
        return this.$route.query.year
      },
      set: function(val) {
        let query = Object.assign({}, this.$route.query)
        if (val) {
          query.year = val
          this.fetchYearData(val)
        } else {
          delete query.year
        }
        this.$router.push({ path: '/standard', query }, () => {})
      }
    },
    system: {
      get: function() {
        return this.$route.query.system
      },
      set: function(val) {
        let query = Object.assign({}, this.$route.query)
        if (val) {
          query.system = val
        } else {
          delete query.system
        }
        this.$router.push({ path: '/standard', query }, () => {})
      }
    },
    department: {
      get: function() {
        return this.$route.query.department
      },
      set: function(val) {
        let query = Object.assign({}, this.$route.query)
        if (val) {
          query.department = val
          this.parseDepartmentData(this.standardData[this.system][val])
        } else {
          delete query.department
        }
        this.$router.push({ path: '/standard', query }, () => {})
      }
    }
  },
  methods: {
    async fetchYearsData() {
      const loading = this.$vs.loading()
      try {
        this.years = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/standards.json`).then(x => x.json())
        loading.close()
      } catch (e) {
        this.onError = e
        loading.close()
      }
    },
    async fetchYearData(yr) {
      const loading = this.$vs.loading()
      try {
        this.standardData = await fetch(`https://gnehs.github.io/ntut-course-crawler-node/${yr}/standard.json`).then(x => x.json())
        loading.close()
      } catch (e) {
        this.onError = e
        loading.close()
      }
    },
    parseDepartmentData(data) {
      let tempCourse = {}
      data.courses.map(x => {
        if (!tempCourse[x.year]) tempCourse[x.year] = {}
        if (!tempCourse[x.year][x.sem]) tempCourse[x.year][x.sem] = []
        tempCourse[x.year][x.sem].push(x)
      })
      data.courses = tempCourse
      this.currentDepartment = data
    }
  }
}
</script>

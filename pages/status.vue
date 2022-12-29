<template>
  <div>
    <h1>擷取狀態</h1>
    <p>僅顯示最新 50 筆資料</p>
    <div class="run-items">
      <a
        class="run-item"
        v-for="item of workflow_runs"
        :key="item.id"
        :href="item.html_url"
        target="_blank">
        <div class="run-item-icon" :class="[item.status]">
          <i class="bx bx-loader bx-spin" v-if="item.status == 'in_progress'" />
          <i class="bx bx-check" v-else-if="item.status == 'completed'" />
          <i class="bx bx-question-mark" v-else />
        </div>
        <div class="run-item-header">
          <div class="run-item-title">{{ parseName(item.name) }}</div>
          <div class="run-item-status">
            <i class="bx bx-calendar" v-if="item.event == 'schedule'" />
            <i class="bx bx-git-commit" v-else-if="item.event == 'push'" />
            <i class="bx bx-revision" v-else-if="item.event == 'dynamic'" />
            <i class="bx bx-question-mark" v-else />
            <span>•</span>
            {{ timeSince(new Date(item.created_at)) }}前
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  head() {
    return {
      title: '擷取狀態'
    }
  },
  data() {
    return {
      workflow_runs: []
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      if (!window.workflow_runs_cache) {
        let loading = this.$vs.loading()
        window.workflow_runs_cache = await fetch('https://api.github.com/repos/gnehs/ntut-course-crawler-node/actions/runs')
          .then(res => res.json())
          .then(data => data.workflow_runs)
        loading.close()
      }
      this.workflow_runs = window.workflow_runs_cache
      this.workflow_runs = this.workflow_runs.slice(0, 50)
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
    parseName(name) {
      if (name == 'fetch current courses') return '取得本學期課程'
      if (name == 'fetch current departments') return '取得本學期科系'
      if (name == 'fetch standards') return '取得課程標準'
      if (name == 'pages build and deployment') return 'API 資料建置與部署'
      if (name == 'Run Analytics & Fatch calendar') return '分析課程資料與取得行事曆'
      if (name == 'Run Analytics & Fatch calendar') return '分析課程資料與取得行事曆'
      if (name == 'Run Analytics') return '分析課程資料'
      return name
    }
  }
}
</script>

<style lang="sass">
.run-items
  .run-item
    padding: 8px
    margin: 8px 0
    background-color: rgba(var(--vs-background),1)
    display: flex
    align-items: center
    text-decoration: none
    color: currentColor
    border-radius: 12px
    transition: all .25s ease
    box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
    &:hover
      box-shadow: 0 10px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
      transform: translate(0, -5px)
      color: rgba(var(--vs-text),.8)
    &:active
      box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, var(--vs-shadow-opacity,0))
      transform: translate(0, 5px)
    .run-item-icon
      --color: 25, 91, 255
      width: 32px
      height: 32px
      display: grid
      place-items: center
      background-color: rgba(var(--color),.2)
      color: rgba(var(--color),1)
      border-radius: 100em
      font-size: 1.5em
      &.completed
        --color: 70,201,58
    .run-item-header
      margin-left: 8px
      .run-item-status
        font-size: .8em
        opacity: .75
</style>
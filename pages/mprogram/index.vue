<template>
  <div v-if="filteredProgramData">
    <h1>選擇微學程</h1>
    <div class="cards" style="--card-row: 4; --card-row-sm: 1">
      <card>
        <p>輸入關鍵字來篩選</p>
        <vs-input v-model="filterProgramVal" @input="filterProgram" />
      </card>
    </div>
    <vs-alert v-show="onError">
      <template #title>搜尋時發生了錯誤</template>
      <pre>{{ onError || 'Error' }}</pre>
    </vs-alert>
    <div class="cards" style="--card-row: 5; --card-row-sm: 3">
      <card
        v-for="program in filteredProgramData"
        :key="program.id"
        class="hoverable padding"
        :to="`/mprogram/${year}/${sem}/${program.id}`"
      >
        <card-title>{{ program.name }}</card-title>
        <p>{{ program.id }}</p>
      </card>
    </div>
  </div>
</template>

<script>
export default {
  created() {
    this.fetchData()
  },
  data: () => ({
    onError: null,
    programData: null,
    filteredProgramData: null,
    filterProgramVal: null
  }),
  head() {
    return {
      title: '微學程'
    }
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
    year() {
      this.fetchData()
    },
    sem() {
      this.fetchData()
    }
  },
  methods: {
    async fetchData() {
      const loading = this.$vs.loading()
      try {
        this.programData = await fetch(
          this.$api(`/${this.year}/${this.sem}/mprogram.json`)
        ).then(x => x.json())
        this.filteredProgramData = this.programData
      } catch (e) {
        this.onError = e
        this.filteredProgramData = []
      }
      loading.close()
    },
    filterProgram() {
      this.onError = null
      try {
        let val = this.filterProgramVal
        if (val) {
          this.filteredProgramData = this.programData.filter(
            x => x.name.includes(val) || x.id.includes(val)
          )
        } else {
          this.filteredProgramData = this.programData
        }
      } catch (e) {
        this.onError = e
        this.filteredProgramData = []
      }
    }
  }
}
</script>

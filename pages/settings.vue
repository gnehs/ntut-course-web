<template>
  <div>
    <h1>設定</h1>
    <vs-alert>
      <template #title>快取資料</template>
      清空快取資料並不會清空您儲存的課表，僅會清空已被快取課程資料，並在下次使用時重新下載，在通常情況下，您不需要清空快取資料。
      <template #footer>
        <vs-button @click="cleanStore">清空網站快取</vs-button>
      </template>
    </vs-alert>
  </div>
</template>
<script>
export default {
  mounted() {
    console.log(window.$ntutCourse)
  },
  data() {
    return {
      test: Object.keys(window.$ntutCourse)
    }
  },
  methods: {
    async cleanStore() {
      window.$ntutCourse = {}
      await this.$cleanStore()
      alert('清空成功！')
      location.reload()
    }
  }
}
</script>
<template>
  <div v-if="show">
    <tag v-for="tag of tags" :key="tag.name" :color="tag.color">
      <i :class="tag.icon" v-if="tag.icon" />
      {{ tag.name }}
    </tag>
  </div>
</template>
<script>
export default {
  props: ['courseData'],
  data() {
    return {
      show: false,
      tags: []
    }
  },
  created() {
    function getcolor(name) {
      if (name.match(/創新與創業|創創/))
        return '#FFC107'
      if (name.match(/文化|美學與藝術|人文與藝術/))
        return '#FF5722'
      if (name.match(/自然與科學|自然向度/))
        return '#03A9F4'
      if (name.match(/社會|法治/))
        return '#2196F3'
      return null
    }
    // 博雅課程
    if (this.courseData.class.some(x => x.name.match(/^博雅/))) {
      this.tags = this.courseData.notes.replace(/◎|\*/g, '').split(/106-108：|。109 \(含\) 後：/).filter(x => x).map(x => ({
        name: x, color: getcolor(x) || '#777'
      }))
    }
    this.show = this.tags.length
  }
}
</script>
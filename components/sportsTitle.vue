<template>
  <span>
    <i :class="icon" v-if="icon" />
    {{ title }}
  </span>
</template>
<script>
export default {
  props: ['courseData'],
  data() {
    return {
      title: '',
      icon: null
    }
  },
  created() {
    function getIcon(name) {
      if (name.match(/籃球/))
        return 'bx bx-basketball'
      if (name.match(/棒球/))
        return 'bx bx-baseball'
      if (name.match(/足球/))
        return 'bx bx-football'
      if (name.match(/網球/))
        return 'bx bx-tennis-ball'
      if (name.match(/保齡球/))
        return 'bx bx-bowling-ball'
      if (name.match(/體適能/))
        return 'bx bx-run'
      if (name.match(/羽球/))
        return 'mdi mdi-badminton'
      if (name.match(/排球/))
        return 'mdi mdi-volleyball'
      if (name.match(/桌球/))
        return 'mdi mdi-table-tennis'
      if (name.match(/撞球/))
        return 'mdi mdi-billiards'
      if (name.match(/太極/))
        return 'mdi mdi-crowd'
      if (name.match(/適應/))
        return 'mdi mdi-walk'
      if (name.match(/美學/))
        return 'bx bx-body'
      return null
    }
    // 體育課
    if (this.courseData.class.some(x => x.name.match(/體育/))) {
      this.title = this.courseData.notes.replace(/^\*|\/(.+)|\((.+)\)| |[A-z]/g, '')
      this.icon = getIcon(this.title)
    } else {
      this.title = this.courseData.name
    }
  }
}
</script>
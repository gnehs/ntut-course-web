<template>
  <div class="tag" :style="{ '--color': color, '--text-color': textColor }">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      default: '#409EFF'
    },
    textColor: {
      type: String,
      default: '#FFF'
    }
  }
}
</script>

<style lang="sass" scoped>
.tag
  display: inline-flex
  align-items: center
  color: #fff
  background-color: var(--color)
  color: var(--text-color)
  padding: 0.5em 0.75em
  border-radius: 0.5em
  font-size: 0.5em
  line-height: 1em
  text-align: center
  white-space: nowrap
</style>
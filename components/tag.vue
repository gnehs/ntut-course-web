<template>
  <div class="tag" :style="{ '--color': color }">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      default: '#409EFF'
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
    padding: 0.5em 0.75em
    border-radius: 0.5em
    font-size: 0.5em
    line-height: 1em
</style>
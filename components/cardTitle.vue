<template>
  <h3 class="card-title" :class="{spaceBetween}">
    <slot />
  </h3>
</template>
<script>
export default {
  props: {
    spaceBetween: {
      type: Boolean,
      default: false
    }
  }
}
</script>
<style lang="sass" scoped>
.card-title
  margin: 0
  line-height: 18px
  margin-bottom: 2px
  width: 100%
  display: flex
  align-items: center
  flex-direction: row
  justify-content: flex-start
  line-height: 1.25
  &.spaceBetween
    justify-content: space-between
</style>
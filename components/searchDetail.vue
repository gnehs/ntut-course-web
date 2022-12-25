<template>
  <div class="search-deatils">
    <div class="search-deatils__header" :class="{ 'detail-show': showDetail, enabled }" @click="showDetail = !showDetail">
      <div class="header-content">
        <slot name="header"></slot>
      </div>
      <div class="icon">
        <i class='bx bx-chevron-down'></i>
      </div>
    </div>
    <TransitionExpand>
      <div class="search-deatils__body" v-if="showDetail">
        <slot name="body"></slot>
      </div>
    </TransitionExpand>
  </div>
</template>
<script>
export default {
  props: { enabled: { default: false } },
  data() {
    return {
      showDetail: false
    }
  }
}
</script>
<style lang="sass" scoped>
.search-deatils
  margin: 0 -16px
  position: relative
  .search-deatils__header
    border-top: 1px solid rgba(var(--vs-text),.1)
    padding: 12px 16px
    display: flex
    justify-content: space-between
    align-items: center
    cursor: pointer
    transition: all .25s ease
    font-size: .85rem
    letter-spacing: 1px
    opacity: .75
    user-select: none
    &:hover
      background-color: rgba(var(--vs-text),.05)
    &:active
      background-color: rgba(var(--vs-text),.1)
    &.enabled
      opacity: 1
      font-weight: bold
    &.detail-show .icon
      transform: translateY(-2px) rotate(180deg)
    .icon
      transition: all .25s ease
      font-size: 1.25rem
  .search-deatils__body
    transition: all .25s ease
    margin: 12px 16px
    margin-top: 4px
</style>
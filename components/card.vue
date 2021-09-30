<template>
  <div class="card" :is="to ? 'router-link' : 'div'" :to="to">
    <slot />
  </div>
</template>
<script>
export default {
  name: 'card',
  props: {
    to: {
      type: String
    }
  }
}
</script>
<style lang="sass">
.card
  background: rgba(var(--vs-background),1)
  color: #2c3e50
  color: var(--vs-text)
  width: 100%
  box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
  border-radius: 12px
  transition: all .25s ease
  position: relative
  padding: 6px 8px
  overflow: hidden
  text-decoration: none
  &[disabled]
    pointer-events: none
  &:not(.hoverable)
    box-shadow: 0 0px 0px 1px rgba(var(--vs-text),.1)
  &.borderless
    box-shadow: none
    background: transparent
    padding: 4px 0px
  &.padding
    padding: 12px 16px
  &.hoverable
    cursor: pointer

    &>i
      transform: translateY(20%)
    &:hover
      box-shadow: 0 10px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
      transform: translate(0, -5px)
      color: var(--vs-text)
      &>i
        opacity: .4
        transform: none
    &:active
      box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, var(--vs-shadow-opacity,0))
      transform: translate(0, 5px)
  p
    margin: 0
    opacity: 0.8
    font-size: 0.85rem
    &+p
      margin-top: 8px
  &>i
    position: absolute
    bottom: 0
    right: .1em
    font-size: 48px
    opacity: .2
    transition: all .25s ease
    margin: auto
    transform-origin: bottom right
</style>
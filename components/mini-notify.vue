<template>

  <div class="mini-notify-container">
    <div class="mini-notify">
      <slot />
    </div>
  </div>
</template>
<style lang="sass" scoped>
.mini-notify-container
  text-align: center
.mini-notify
  display: inline-block
  padding: 4px 8px
  border-radius: 4px
  background-color: rgba(var(--vs-primary), .1)
  color: rgba(var(--vs-primary), 1)
  font-size: .75em
  font-weight: 500
  margin: 4px 0
</style>
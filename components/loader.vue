<template>
  <div class="loader-container">
    <div class="loader"></div>
  </div>
</template>


<style lang="sass" scoped>
.loader-container
  display: flex
  justify-content: center
  align-items: center
  height: 100%
  margin-top: 64px
.loader
  border: 4px solid rgba(var(--vs-text), .1)
  border-radius: 50%
  border-top: 4px solid rgba(var(--vs-primary), 1)
  width: 48px
  height: 48px
  animation: spin 1s linear infinite
@keyframes spin
  0%
    transform: rotate(0deg)
  100%
    transform: rotate(360deg)
</style>
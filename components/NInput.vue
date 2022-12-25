<template>
  <div class="p-input" :class="{ _value: _value.length }">
    <label class="p-input__label" :for="randomInputId">
      <span class="p-input__label-text">{{ label }}</span>
    </label>
    <input class="p-input__input" :id="randomInputId" v-model="_value" :type="type" v-bind="$attrs" />
  </div>
</template>
<script>
export default {
  name: 'PokaTextInput',
  props: {
    type: {
      type: String,
      default: 'text'
    },
    label: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      randomInputId: `input_${Math.random().toString(36).substr(2, 9)}`
    }
  },
  computed: {
    _value: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  }
}
</script>
<style lang="sass" scoped>
.p-input
  display: flex
  flex-direction: column
  width: 100%
  &+.p-input
    margin-top: calc(var(--padding) * 2)
  .p-input__label
    display: flex
    align-items: center
    .p-input__label-text
      font-size: 14px
      color: var(--text-color)
      transition: all var(--transition)

  &:has(input:focus)
    .p-input__label
      .p-input__label-text
        color: var(--primary-color)
        font-weight: bold
  .p-input__input
    border: none
    outline: none
    background: none
    width: 100%
    height: 100%
    padding: calc(var(--padding) * 1.5) var(--padding)
    font-size: 16px
    border-bottom: var(--border-width) solid var(--border-color)
    transition: border-bottom var(--transition), box-shadow var(--transition)
    box-shadow: 0px 1px transparent
    border-radius: 0
    color: var(--text-color)
    &:focus
      border-color: var(--primary-color)
      box-shadow: 0px 1px var(--primary-color)
</style>
<template>
  <div>
    <div style="display: flex;justify-content: space-between;align-items: center;">
      <h1>行事曆</h1>
      <vs-button
        transparent
        :active="important"
        @click="important = !important">
        <i class="bx bx-check" v-if="important"></i>
        僅顯示重要日程
      </vs-button>
    </div>


    <transition-group name="list" tag="div" class="calendar-items" v-if="filteredCalendarData">
      <div class="calendar-item" v-for="(item, i) of filteredCalendarData" :key="item.uid">
        <div class="calendar-icon" :style="{ opacity: filteredCalendarData.at(i - 1).start == item.start ? 0 : 1 }">
          <div class="calendar-month">
            {{ new Date(item.start).getMonth() + 1 }} 月
          </div>
          <div class="calendar-day">
            {{ new Date(item.start).getDate() }}
          </div>
        </div>
        <div class="calendar-item-content">
          <div class="calendar-item-title">
            {{ item.summary }}
          </div>
          <div class="calendar-item-description">
            {{ new Date(item.start).toLocaleDateString() }} ~ {{ new Date(item.end).toLocaleDateString() }}
          </div>
        </div>
      </div>
    </transition-group>
    <loader v-else />
    <div class="data-source">
      資料來源：<a href="https://calendar.google.com/calendar/embed?src=docfuhim9b22fqvp2tk842ak3c%40group.calendar.google.com&ctz=Asia%2FTaipei"
        target="_blank">教務處行事曆－學生版</a>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      calendarData: null,
      filteredCalendarData: null,
      important: false,
    }
  },
  mounted() {
    this.getCalendarData()
  },
  watch: {
    important(val) {
      this.toggleImportant(val)
    }
  },
  methods: {
    getCalendarData() {
      fetch(`https://gnehs.github.io/ntut-course-crawler-node/calendar.json`)
        .then(response => response.json())
        .then(response => {
          this.calendarData = response
            .filter(x => new Date(x.start) > new Date() - 86400000)
          this.filteredCalendarData = this.calendarData
        })
    },
    toggleImportant(val) {
      if (val) {
        this.filteredCalendarData = this.calendarData.filter(x => x.summary.match(/補假|加選|開學|會考|撤選|校慶|期中|期末考|網路教學評量|全校週會|選課|放假/))
      } else {
        this.filteredCalendarData = this.calendarData
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.calendar-items
  border-radius: 4px
  border: 1px solid #ccc
  overflow: hidden
  position: relative
  .calendar-item
    padding: 8px
    display: flex
    align-items: center
    gap: 8px
    background-color: #fff
    &:not(:first-child)
      border-top: 1px solid #ccc
    .calendar-icon
      --size: 48px
      width: var(--size)
      height: var(--size)
      border-radius: calc(var(--size) / 12)
      border: 1px solid #ccc
      text-align: center
      font-family: 'Noto Sans TC', sans-serif
      display: flex
      flex-direction: column
      justify-content: center
      align-items: center
      transition: all .25s ease
      .calendar-month
        font-size: calc(var(--size) / 4)
        flex: 1
        width: 100%
        border-radius: 4px 4px 0 0
        color: #fff
        background-color: red
      .calendar-day
        font-size: calc(var(--size) / 2.5)
        font-weight: bold
    .calendar-item-content
      flex: 1
      .calendar-item-title
        font-size: 1.2em
        font-weight: bold
      .calendar-item-description
        opacity: 0.75
.data-source
  font-size: .75em
  margin: 1em 0
  text-align: center
  opacity: 0.75
</style>
<style lang="sass">
//list
.list-leave-to
  opacity: 0
  transform-origin: center top
.list-leave-active
  transition: all .25s ease
  transform-origin: center top
  position: absolute
  width: 100%
.list-move
  transition: all .25s ease
  transition-property: opacity, transform, filter
</style>
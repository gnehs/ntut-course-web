<template>
  <div class="search-box-container" :class="{ navbar }">
    <div class="search-box">
      <input
        type="text"
        placeholder="搜尋課程、教師或是班級⋯"
        ref="searchInput"
        v-model="searchInput"
        @input="searchInputChange"
        @focus="onFocus"
        @blur="onBlur"
        @keydown.down.prevent="onArrowDown"
        @keydown.up.prevent="onArrowUp"
        @keydown.enter.tab.prevent="selectCurrentSelection"
        @keydown.esc.prevent="onEsc"
        @mouseenter="currentSelectionIndex = -1"
        autocomplete="off" />
      <button v-if="searchInput.length" @click="searchInput = ''; searchInputChange()">
        <i class='bx bx-x'></i>
      </button>
      <button v-else>
        <i class='bx bx-loader-alt bx-spin' v-if="loading"></i>
        <i class='bx bx-search' v-else></i>
      </button>
    </div>
    <div class="search-autocomplete-items">
      <div
        class="search-autocomplete-item"
        :class="{ focus: currentSelectionIndex == i }"
        v-for="(item, i) of searchAutocompleteItems"
        :key="item.id"
        @click="selectItem(item)"
        @mousedown.prevent
        @mouseenter="currentSelectionIndex = i">
        <div class="search-autocomplete-item-content">
          <div class="search-autocomplete-item-category">
            {{ item.category }}
          </div>
          <div class="search-autocomplete-item-text">
            {{ item.text }}
          </div>
        </div>
        <div class="search-autocomplete-item-icon" v-if="item.history">
          <i class='bx bx-right-arrow-alt' v-if="currentSelectionIndex == i" />
          <i class='bx bx-history' v-else />
        </div>
        <div class="search-autocomplete-item-icon" v-else>
          <i class='bx bx-right-arrow-alt' />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchInput: '',
      searchAutocompleteItems: [],
      currentSelectionIndex: -1,
      loading: false,
    }
  },
  mounted() {
    this.loadSearchHistory()
  },
  watch: {
    currentSelectionIndex() {
      if (this.currentSelectionIndex >= 0) {
        this.scrollSelectionIntoView()
      }
    },
    year(newCount, oldCount) {
      this.fetchCourseData()
    },
    sem(newCount, oldCount) {
      this.fetchCourseData()
    }
  },
  props: {
    navbar: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    loadSearchHistory() {
      this.searchAutocompleteItems = JSON.parse(localStorage[`search-history`] || '[]').reverse()
    },
    async fetchCourseData() {
      this.loading = true
      if (!this.courseData) {
        this.courseData = await this.$fetchCourse()
      }
      this.loading = false
      return this.courseData
    },
    async searchInputChange() {
      function genRandomId() {
        return Math.random().toString(36).substring(2, 15)
      }
      let year = localStorage[`data-year`]
      let sem = localStorage[`data-sem`]
      let department = localStorage[`data-department`]
      let courses = await this.fetchCourseData()
      let val = this.searchInput
      try {
        val = val.toLowerCase()
      } catch (e) { }
      let searchAutocompleteItems = []
      if (val) {
        let keywords = val.split(' ')
        // is number
        // 課號
        if (!isNaN(val) && val.length >= 3) {
          searchAutocompleteItems.push(
            ...courses
              .filter(course => course.id.includes(val))
              .map(course => ({
                id: `${year}/${sem}/${course.id}`,
                type: 'course',
                to: `/course/${year}/${sem}/${course.id}`,
                category: course.id,
                text: course.name.zh,
                //course,
              })).slice(0, 10)
          )
        }
        // 班級
        searchAutocompleteItems.push(
          ...Array.from(
            new Set(courses
              .map(course => course.class)
              .flat(2)
              .map(x => x.name)
              .filter(x => x.toLowerCase().includes(val))
            )
          )
            .map(x => ({
              id: `${x}?year=${year}&sem=${sem}&d=${department}`,
              type: 'class',
              to: `/class/${x}?year=${year}&sem=${sem}&d=${department}`,
              category: `班級`,
              text: x,
            }))
            .slice(0, 10)
        )
        // 教師
        searchAutocompleteItems.push(
          ...Array.from(
            new Set(courses
              .map(course => course.teacher)
              .flat(2)
              .map(x => x.name)
              .filter(x => x.toLowerCase().includes(val))
            )
          )
            .map(x => ({
              id: `teacher/${x}`,
              type: 'teacher',
              to: `/teacher/${x}`,
              category: `教師`,
              text: x,
            }))
            .slice(0, 10)
        )
        // 課程名稱、教師名稱
        let autocompleteCourses = courses
        for (let keyword of keywords) {
          autocompleteCourses = autocompleteCourses.filter(course =>
            course.name?.zh.toLowerCase().includes(keyword) ||
            course.name?.en.toLowerCase().includes(keyword) ||
            course.teacher.map(x => x.name).join(' ').toLowerCase().includes(keyword) ||
            course.class.map(x => x.name).join(' ').toLowerCase().includes(keyword)
          )
        }
        searchAutocompleteItems.push(...autocompleteCourses
          .map(course => ({
            id: `${year}/${sem}/${course.id}`,
            type: 'course',
            to: `/course/${year}/${sem}/${course.id}`,
            category: `${course.id} ${course.teacher.map(x => x.name).join(' ')}`,
            text: course.name.zh,
            course,
          }))
          .sort((a, b) => keywords.some(x => a.text.toLowerCase().includes(x)) ? -1 : 1)
          .slice(0, 20)
        )

        this.searchAutocompleteItems = searchAutocompleteItems.slice(0, 50)
      } else {
        this.loadSearchHistory()
      }
      this.currentSelectionIndex = -1
      this.$refs.searchInput.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    },
    scrollSelectionIntoView() {
      this.$nextTick(() => {
        const active_node = document.querySelector(`.search-autocomplete-items .search-autocomplete-item.focus`);
        active_node.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      });
    },
    onArrowUp() {
      if (this.currentSelectionIndex >= 0) {
        this.currentSelectionIndex--
      }
    },
    onArrowDown() {
      if (this.currentSelectionIndex < this.searchAutocompleteItems.length - 1) {
        this.currentSelectionIndex++
      }
    },
    onFocus() {
      this.currentSelectionIndex = -1
    },
    onBlur() {
      this.currentSelectionIndex = -1
    },
    onEsc() {
      this.currentSelectionIndex = -1
      this.$refs.searchInput.blur()
    },
    selectCurrentSelection() {
      if (this.currentSelectionIndex >= 0) {
        this.selectItem(this.searchAutocompleteItems[this.currentSelectionIndex])
      }
    },
    selectItem(item) {
      let searchHistory = JSON.parse(localStorage[`search-history`] || '[]')
      searchHistory.push({ ...item, history: true })
      searchHistory = searchHistory.slice(-10).reverse().filter((x, i, a) => a.findIndex(y => y.id === x.id) === i).reverse()
      localStorage[`search-history`] = JSON.stringify(searchHistory)
      if (item.to) {
        this.$router.push(item.to)
        this.onEsc()
      }
    }
  },
}
</script>

<style lang="sass" scoped>
.search-box-container
  position: relative
  width: 100%
  margin: 0 auto
  --margin-top: 8px
  --padding: calc(var(--margin-top) * 2) calc(var(--margin-top) * 3)
  &.navbar
    width: 512px
    --margin-top: 4px
    @media screen and (max-width: 768px)
      width: 324px
  .search-box
    display: flex
    border-radius: 8px
    background: rgba(var(--vs-text), .1)
    border: 1px solid rgba(var(--vs-text), 0)
    transition: all .2s ease
    @media (prefers-color-scheme: dark)
      background: rgba(var(--vs-text), .05)
    &:hover
      background: rgba(var(--vs-text), .05)
      @media (prefers-color-scheme: dark)
        background: rgba(var(--vs-text), .075)
    &:has(input:focus)
      background: rgba(var(--vs-gray-1), 1)
      border: 1px solid rgba(var(--vs-gray-4), 1)
      box-shadow: 0 5px 20px 0 rgba(0,0,0,var(--vs-shadow-opacity,.05))
      @media (prefers-color-scheme: dark)
        background-color: rgba(var(--vs-background), 1)
        border: 1px solid rgba(var(--vs-text), .05)
    input,
    button
      border: none
      outline: none
      padding: var(--padding)
      background-color: transparent
      font-size: 16px
      color: rgba(var(--vs-text), 1)
    input
      flex: 1
      scroll-margin-top: 50px
    button
      cursor: pointer
      color: rgba(var(--vs-text), .8)
      display: flex
      align-items: center
      justify-content: center
      transition: all .2s ease
      i
        font-size: 24px
      &:hover
        color: rgba(var(--vs-text), 1)
      &:active
        transform: scale(.9)

  &.navbar
    .search-box
      margin: 4px 0
  .search-autocomplete-items
    position: absolute
    border-radius: 8px
    background-color: rgba(var(--vs-background), 1)
    width: 100%
    margin-top: var(--margin-top)
    box-shadow: 0 20px 20px 0 rgba(0,0,0,var(--vs-background-opacity,.02))
    max-height: 512px
    overflow-y: auto
    transition: all .2s ease
    z-index: 1

    opacity: 0
    transform: translateY(-8px)
    pointer-events: none
    @media screen and (max-width: 768px)
      max-height: 256px
    .search-autocomplete-item
      display: flex
      align-items: center
      cursor: pointer
      overflow: hidden
      &:not(:first-child)
        border-top: 1px solid rgba(var(--vs-gray-4), 1)
        @media (prefers-color-scheme: dark)
          border-top: 1px solid rgba(var(--vs-text), .1)
      &.focus
        background: rgba(var(--vs-text), .05)
        .search-autocomplete-item-icon
          transform: translateX(3px)
      .search-autocomplete-item-content
        flex: 1
        padding: var(--padding)
        .search-autocomplete-item-category
          font-size: 12px
          opacity: .8
        .search-autocomplete-item-text
          font-size: 16px
          font-weight: bold
      .search-autocomplete-item-icon
        padding: var(--padding)
        transition: all .2s ease
        i
          font-size: 24px

  &:has(input:focus)
    .search-autocomplete-items
      opacity: 1
      transform: none
      pointer-events: all
</style>
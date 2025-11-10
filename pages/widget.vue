<template>
  <div>
    <h1>iOS 小工具</h1>
    <p>新增小工具在你的桌面上，隨時檢視接下來的課程！</p>
    <p>注意：如果你變更了課程，需要重新複製程式碼才能讓小工具使用最新的課程資料！</p>
    <vs-alert color="danger" v-if="!courseData.length">
      <template #title>沒有課程資料</template>
      請先新增課程資料
    </vs-alert>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 0</span> 加入課程
    </h2>
    <p>
      請先將你本學期的課程新增到
      <strong>北科課程好朋友</strong>
    </p>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 1</span> 安裝 Scriptable
    </h2>
    <p>
      到 App Store 安裝
      <a
        href="https://apps.apple.com/tw/app/scriptable/id1405459188"
        target="_blank">Scriptable</a>
    </p>
    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 2</span> 複製並貼上程式碼
    </h2>
    <p>建立一個 Script 並貼上以下程式碼</p>
    <div class="white-box" style="position: relative">
      <div style="position: absolute; right: 0">
        <vs-button @click="doCopy">
          <i class="bx bx-clipboard"></i>複製
        </vs-button>
      </div>
      <pre id="scriptable-code" ref="scriptable-code">
const courseData = {{ JSON.stringify(courseData) }}
function getUpcomingCourse() {
    let currentDate = new Date()
    let timetable = {
        '1': '8:10',
        '2': '9:10',
        '3': '10:10',
        '4': '11:10',
        N: '12:10',
        '5': '13:10',
        '6': '14:10',
        '7': '15:10',
        '8': '16:10',
        '9': '17:10',
        A: '18:30',
        B: '19:20',
        C: '20:20',
        D: '21:10'
    }
    let dateEng2zh = { sun: '週日', mon: '週一', tue: '週二', wed: '週三', thu: '週四', fri: '週五', sat: '週六' }
    // show upcoming course
    let upcomingCourseIncludes = Object.entries(timetable)
        .filter(([courseId, courseTime]) => {
            let tempDate = new Date()
            tempDate.setHours(courseTime.split(':')[0], courseTime.split(':')[1], 0)
            return tempDate > currentDate
        })
        .map(x => x[0])
    let todayDayOfWeek = Object.keys(dateEng2zh)[currentDate.getDay()]
    return courseData
        .filter(x => x.time[todayDayOfWeek].some(r => upcomingCourseIncludes.includes(r))).map(x => ({
            ...x,
            start: timetable[x.time[todayDayOfWeek][0]],
            length: x.time[todayDayOfWeek].length,
        }))
        .sort((a, b) => a.time[todayDayOfWeek][0] - b.time[todayDayOfWeek][0])
}
function createWidget() {
    let gradient = new LinearGradient()
    gradient.locations = [0, 1]
    gradient.colors = [
        new Color("292929"),
        new Color("141414")
    ]

    let widget = new ListWidget()
    widget.backgroundGradient = gradient

    let titleTxt = widget.addText('接下來的課程')
    titleTxt.textColor = Color.white()
    titleTxt.textOpacity = 0.7
    titleTxt.font = Font.mediumSystemFont(13)

    widget.addSpacer(7)
    let upcomingCourse = getUpcomingCourse()
    if (upcomingCourse.length) {
        let course = upcomingCourse[0]
        let courseTxt = widget.addText(course.name)
        courseTxt.textColor = Color.white()
        courseTxt.font = Font.boldSystemFont(16)

        widget.addSpacer(2)
        if (course.classroom != '') {
            let classTxt = widget.addText(course.classroom)
            classTxt.textColor = Color.white()
            classTxt.font = Font.systemFont(13)
        }
        let summaryTxt = widget.addText(`於 ${course.start} 開始，共 ${course.length} 節`)
        summaryTxt.textColor = Color.white()
        summaryTxt.font = Font.systemFont(13)
        if (config.runsWithSiri) {
            Speech.speak(` 你在 ${course.start} 有一堂 ${course.name}`)
        } else {
            widget.addSpacer()
            // Add button to open course detail
            let linkSymbol = SFSymbol.named("arrow.up.forward.square")
            let footerStack = widget.addStack()
            let linkStack = footerStack.addStack()
            linkStack.centerAlignContent()
            linkStack.url = course.link
            let linkElement = linkStack.addText("詳細資料")
            linkElement.font = Font.mediumSystemFont(13)
            linkElement.textColor = Color.blue()
            linkStack.addSpacer(3)
            let linkSymbolElement = linkStack.addImage(linkSymbol.image)
            linkSymbolElement.imageSize = new Size(13, 13)
            linkSymbolElement.tintColor = Color.blue()
            footerStack.addSpacer()
            // Add link to open course detail
            let iconElement = footerStack.addText("🍤")
            iconElement.textOpacity = 0.5
            iconElement.font = Font.mediumSystemFont(13)
            iconElement.url = `http://{{ $config.domainName }}/`
        }
    } else {
        let courseTxt = widget.addText('沒有課程')
        courseTxt.textColor = Color.white()
        courseTxt.font = Font.boldSystemFont(18)
        if (config.runsWithSiri) {
            Speech.speak(` 好棒，你今天沒課了`)
        }
    }
    // add footer
    if (config.runsWithSiri || !upcomingCourse.length) {
        widget.addSpacer()
        let footerStack = widget.addStack()
        let providerText = footerStack.addText("🍤 北科課程好朋友")
        providerText.textColor = Color.white()
        providerText.textOpacity = 0.7
        providerText.font = Font.mediumSystemFont(13)
        footerStack.url = `http://{{ $config.domainName }}/`
    }
    return widget
}

let widget = createWidget()
if (config.runsInWidget) {
    Script.setWidget(widget)
} else {
    widget.presentMedium()
}
Script.complete()
</pre>
    </div>

    <h2>
      <span style="color: rgb(var(--vs-primary))">Step 3</span> 新增小工具到桌面
    </h2>
    <p>參考此影片建立你的小工具</p>
    <video loop controls autoplay class="demo-video">
      <source src="/video/how_to_add_iOS_widget.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script>
export default {
  head() {
    return {
      title: 'iOS 小工具',
    }
  },
  data() {
    return {
      courseData: []
    }
  },
  async created() {
    await this.getMyCourse()
  },
  methods: {
    async getMyCourse() {
      let { year, sem, department } = this.$store.state
      let myCourseKey = `my-couse-data-${year}-${sem}`
      if (department != 'main') {
        myCourseKey += `-${department}`
      }
      let courseIds = JSON.parse(localStorage[myCourseKey] || '[]')
      let course = await this.$fetchCourse(year, sem, department)

      this.courseData = course
        .filter(x => courseIds.includes(x.id))
        .map(x => ({
          name: x.name.zh,
          time: x.time,
          classroom: x.classroom
            .map(y => y.name)
            .join('、')
            .trimEllip(13),
          link: `https://${this.$config.domainName}/course/${year}/${sem}/${x.id}`
        }))
    },
    doCopy() {
      try {
        window.gtag('event', 'copy_ios_widget_code')
      } catch (e) { }
      this.$copyText(this.$refs['scriptable-code'].textContent).then(
        e => {
          this.$vs.notification({
            title: '已複製',
            text: '請到 Scriptable 貼上程式碼即可使用小工具'
          })
        },
        e => {
          this.$vs.notification({
            title: '複製失敗',
            color: 'danger',
            text: '請嘗試手動複製'
          })
        }
      )
    }
  }
}
</script>

<style lang="sass" scoped>
#scriptable-code
  width: 100%
  height: 512px
  overflow: hidden scroll
.demo-video
  height: 700px
  max-width: 100%
  margin: 0 auto
  display: block
  border-radius: 16px
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.05)
</style>
<template>
  <div>
    <h1>iOS 小工具（測試）</h1>
    <p>新增小工具在您的桌面上，隨時檢視接下來的課程！</p>
    <h2><span style="color: blue">Step 0</span> 加入課程</h2>
    <p>請先將您本學期的課程新增到<strong>北科課程好朋友</strong></p>
    <h2><span style="color: blue">Step 1</span> 安裝 Scriptable</h2>
    <p>到 App Store 安裝 <a href="https://apps.apple.com/tw/app/scriptable/id1405459188" target="_blank">Scriptable</a></p>
    <h2><span style="color: blue">Step 2</span> 複製並貼上程式碼</h2>
    <p>建立一個 Script 並貼上以下程式碼即可使用小工具</p>
    <div class="white-box">
      <pre style="width: 100%; height: 512px; overflow: hidden scroll" id="scriptable-code">
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
    return courseData.filter(x => x.time[todayDayOfWeek].some(r => upcomingCourseIncludes.includes(r))).map(x => ({
        ...x,
        start: timetable[x.time[todayDayOfWeek][0]],
        length: x.time[todayDayOfWeek].length, 
    }))
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

    let titleTxt = widget.addText('🍤 接下來的課程')
    titleTxt.textColor = Color.white()
    titleTxt.textOpacity = 0.7
    titleTxt.font = Font.mediumSystemFont(13)

    widget.addSpacer(7)
    let upcomingCourse = getUpcomingCourse()
    if (upcomingCourse.length) {
        let course = upcomingCourse[0]
        let courseTxt = widget.addText(course.name)
        courseTxt.textColor = Color.white()
        courseTxt.font = Font.boldSystemFont(18)

        widget.addSpacer(2)
        if (course.classroom!='') {
            let classTxt = widget.addText(course.classroom)
            classTxt.textColor = Color.white()
            classTxt.font = Font.systemFont(18)
        }
        let summaryTxt = widget.addText(`於 ${course.start} 開始，共 ${course.length} 節`)
        summaryTxt.textColor = Color.white()
        summaryTxt.font = Font.systemFont(18)
        if (config.runsWithSiri) {
            Speech.speak(`在 ${course.start} 有一堂 ${course.name}`)
        } else {
            widget.addSpacer(8)
            // Add button to open documentation
            let linkSymbol = SFSymbol.named("arrow.up.forward")
            let footerStack = widget.addStack()
            let linkStack = footerStack.addStack()
            linkStack.centerAlignContent()
            linkStack.url = course.link
            let linkElement = linkStack.addText("詳細資料")
            linkElement.font = Font.mediumSystemFont(13)
            linkElement.textColor = Color.blue()
            linkStack.addSpacer(3)
            let linkSymbolElement = linkStack.addImage(linkSymbol.image)
            linkSymbolElement.imageSize = new Size(11, 11)
            linkSymbolElement.tintColor = Color.blue()
            footerStack.addSpacer()
            // Add link to documentation
            let docsSymbol = SFSymbol.named("book")
            let docsElement = footerStack.addImage(docsSymbol.image)
            docsElement.imageSize = new Size(20, 20)
            docsElement.tintColor = Color.white()
            docsElement.imageOpacity = 0.5
            docsElement.url = course.link
        }

    } else {
        let courseTxt = widget.addText('沒有課程')
        courseTxt.textColor = Color.white()
        courseTxt.font = Font.boldSystemFont(18)
        if (config.runsWithSiri) {
            Speech.speak(`好棒，你今天沒課了`)
        } 
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
    </pre
      >
    </div>
  </div>
</template>

<script>
export default {
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
          link: `https://ntut-course.gnehs.net/course/${year}/${sem}/${x.id}`
        }))
    }
  }
}
</script>

<style>
</style>
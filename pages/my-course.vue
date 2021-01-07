<template>
	<div>
		<div class="lr-container">
			<div class="l">
				<h1>我的課程（Beta）</h1>
			</div>
			<div class="r" style="display: flex">
				<vs-button flat @click="exportData">
					<i class="bx bxs-file-export"></i>匯出
				</vs-button>
				<vs-button flat @click="importData">
					<i class="bx bxs-file-import"></i>匯入
				</vs-button>
			</div>
		</div>
		<!--<p>你可以在這裡儲存一些課程，會於搜尋與課程頁面自動與其他課程比對是否衝堂。</p>-->
		<p>你可以在這裡儲存一些課程供未來選課時參考用。</p>
		<vs-alert v-if="myCourses.length" key="notice">
			<template #title>提醒</template>
			請注意，本資料僅儲存在瀏覽器中，可能會隨時消失！
		</vs-alert>
		<parse-courses :courses="myCourses" showTimetable v-if="myCourses.length" />
		<vs-alert v-else key="noCourses">
			<template #title>尚未儲存任何課程</template>
			你可以在班級頁面或是課程頁面右上方找到「加入我的課程」按鈕！
			<br />如果沒看到先前加入的，請嘗試在右上角的下拉選單切換學期。
		</vs-alert>
	</div>
</template>
  
<script>
export default {
	data: () => ({
		onError: null,
		myCourses: [],
	}),
	computed: {
		year() {
			return this.$store.state.year
		},
		sem() {
			return this.$store.state.sem
		}
	},
	watch: {
		year(newCount, oldCount) {
			this.getMyCourse()
		},
		sem(newCount, oldCount) {
			this.getMyCourse()
		}
	},
	created() {
		this.getMyCourse()
	},
	methods: {
		async getMyCourse() {
			let { year, sem } = this.$store.state
			let myCourseKey = `my-couse-data-${year}-${sem}`

			let courseIds = JSON.parse(localStorage[myCourseKey] || '[]')
			let course = await this.$fetchCourse(year, sem)
			this.myCourses = course.filter(x => courseIds.includes(x.id))
		},
		exportData() {
			let { year, sem } = this.$store.state
			let myCourseKey = `my-couse-data-${year}-${sem}`
			let myCourseClassKey = `my-couse-class-${year}-${sem}`

			let res = JSON.stringify({ key: myCourseKey, data: localStorage[myCourseKey], classKey: myCourseClassKey, classData: localStorage[myCourseClassKey] })
			prompt('請複製以下資料：', res)

		},
		importData() {
			let importedData = prompt('請貼上先前複製的資料：')
			if (importedData) {
				let { key, data, classKey, classData } = JSON.parse(importedData)
				localStorage[key] = data
				localStorage[classKey] = classData

				this.$vs.notification({
					title: '匯入完成！',
					text: `已匯入 ${JSON.parse(localStorage[key]).length} 筆課程到我的課程`
				})
				this.getMyCourse()
			}
		}
	}
}
</script>
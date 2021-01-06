<template>
	<div>
		<h1>我的課程（Beta）</h1>
		<!--<p>你可以在這裡儲存一些課程，會於搜尋與課程頁面自動與其他課程比對是否衝堂。</p>-->
		<p>你可以在這裡儲存一些課程供未來選課時參考用。</p>
		<vs-alert v-if="Object.values(myCourses).length">
			<template #title>提醒</template>
			請注意，本資料僅儲存在瀏覽器中，可能會隨時消失！
		</vs-alert>
		<parse-courses :courses="Object.values(myCourses)" v-if="Object.values(myCourses).length" />
		<vs-alert v-else>
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
		myCourses: null,
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
		getMyCourse() {
			let { year, sem } = this.$store.state
			let myCourseKey = `my-couse-${year}-${sem}`
			let myCourseClassKey = `my-couse-class-${year}-${sem}`
			this.myCourses = JSON.parse(localStorage[myCourseKey] || '{}')
			console.log(Object.values(this.myCourses))
		}
	}
}
</script>
<template>
	<div>
		<div class="lr-container">
			<div class="l">
				<h1>{{classname}}</h1>
			</div>
			<div class="r">
				<vs-button flat @click="addCourse2myCourse" v-if="!isInMyCouse">
					<i class="bx bx-plus"></i>加入我的課程
				</vs-button>
				<vs-button flat danger @click="removeFromMyCourse" v-else>
					<i class="bx bx-minus"></i>從我的課程移除
				</vs-button>
			</div>
		</div>
		<vs-alert v-show="onError">
			<template #title>擷取資料時發生了錯誤</template>
			<pre>{{onError||'Error'}}</pre>
		</vs-alert>

		<parse-courses :courses="result" />
	</div>
</template>
  
<script>
export default {
	data: () => ({
		onError: null,
		result: null,
		classname: null,
		isInMyCouse: false
	}),
	created() {
		this.getCourseByClass()
	},
	methods: {
		async getCourseByClass() {
			const loading = this.$vs.loading()
			try {
				this.classname = this.$route.params.id
				let classname = this.classname
				let { year, sem } = this.$route.query
				let course = await this.$fetchCourse(year, sem)
				function detectClass(c) {
					let d = c.map(x => x.name)
					return d.includes(classname)
				}
				course = course.filter(x => detectClass(x.class))
				this.result = course
				this.checkIsInMyCourse()
			} catch (e) {
				this.onError = e
				loading.close()
			}
			loading.close()
		},
		checkIsInMyCourse() {
			let { year, sem } = this.$store.state
			let myCourseClassKey = `my-couse-class-${year}-${sem}`
			this.isInMyCouse = (localStorage[myCourseClassKey] == this.classname)
		},
		addCourse2myCourse() {
			let { year, sem } = this.$store.state
			let myCourseKey = `my-couse-${year}-${sem}`
			let myCourseClassKey = `my-couse-class-${year}-${sem}`

			if (localStorage[myCourseClassKey] != this.classname && localStorage[myCourseClassKey]) {
				let changeClass = confirm(`您先前已將「${localStorage[myCourseClassKey]}」之課程加入我的課程，此行為會導致課程過多，要繼續嗎？`)
				if (!changeClass) {
					return
				}
			}
			localStorage[myCourseClassKey] = this.classname

			let myCourseData = JSON.parse(localStorage[myCourseKey] || '{}')
			for (let course of this.result) {
				myCourseData[course.id] = course
			}
			localStorage[myCourseKey] = JSON.stringify(myCourseData)

			this.isInMyCouse = true
			this.$vs.notification({
				title: '加入完成！',
				text: `已將「${this.classname}」加入到我的課程`
			})
		},
		removeFromMyCourse() {
			let { year, sem } = this.$store.state
			let myCourseKey = `my-couse-${year}-${sem}`
			let myCourseClassKey = `my-couse-class-${year}-${sem}`

			let myCourseData = JSON.parse(localStorage[myCourseKey] || '{}')

			for (let course of this.result) {
				delete myCourseData[course.id]
			}
			localStorage[myCourseKey] = JSON.stringify(myCourseData)
			localStorage.removeItem(myCourseClassKey)

			this.isInMyCouse = false
			this.$vs.notification({
				title: '已移除',
				text: `已將「${this.classname}」從我的課程中移除`
			})
		}
	}
}
</script>
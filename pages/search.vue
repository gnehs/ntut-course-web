<template>
	<div>
		<h1>搜尋</h1>
		<p style="font-size:0.85rem;">
			＊關鍵字與教師欄位支援
			<a href="https://en.wikipedia.org/wiki/Regular_expression" teaget="_blank">regex</a>！
		</p>
		<div class="cards" style="--card-row: 4;--card-row-sm: 2">
			<card>
				<p>課號</p>
				<vs-input v-model="searchCourseId" @input="searchCourse" />
			</card>
			<card>
				<p>關鍵字</p>
				<vs-input v-model="searchVal" @input="searchCourse" />
			</card>
			<card>
				<p>教師</p>
				<vs-input v-model="searchTeacher" @input="searchCourse" />
			</card>
		</div>
		<vs-alert v-show="onError">
			<template #title>搜尋時發生了錯誤</template>
			<pre>{{onError}}</pre>
		</vs-alert>
		<parse-courses :courses="searchResult" />
	</div>
</template>
  
<script> 
export default {
	data: () => ({
		onError: null,
		course: null,
		searchVal: '',
		searchCourseId: '',
		searchTeacher: '',
		searchResult: null,
	}),
	created() {
		let { q, id, teacher } = this.$route.query
		this.searchVal = q || ''
		this.searchCourseId = id || ''
		this.searchTeacher = teacher || ''
		this.searchCourse()
	},
	methods: {
		async fetchCourseData() {
			if (!this.course) {
				let { year, sem } = this.$route.query
				this.course = await this.$fetchCourse(year, sem)
			}
			return this.course
		},
		async searchCourse() {
			try {
				this.onError = null
				let course = await this.fetchCourseData()
				let query = Object.assign({}, this.$route.query)
				if (this.searchVal != '') {
					course = course.filter(x => x.name.zh.match(this.searchVal))
					query.q = this.searchVal
				} else {
					query.q = ''
					delete query.q
				}
				if (this.searchCourseId != '') {
					let searchCourseId = this.searchCourseId
					course = course.filter(x => x.id.startsWith(searchCourseId))
					query.id = searchCourseId
				} else {
					query.id = ''
					delete query.id
				}
				if (this.searchTeacher != '') {
					let searchTeacher = this.searchTeacher

					course = course.filter(x => x.teacher.map(y => y.name).join('').match(searchTeacher))
					query.teacher = searchTeacher
				} else {
					query.teacher = ''
					delete query.teacher
				}
				this.searchResult = course
				this.$router.replace({ path: "/search", query }, () => { });
			} catch (e) {
				this.onError = e
				this.searchResult = []
			}
		}
	}
}
</script>
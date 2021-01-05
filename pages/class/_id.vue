<template>
	<div>
		<h1>{{classname}}</h1>
		<vs-alert v-show="onError">
			<template #title>擷取資料時發生了錯誤</template>
			<pre>{{onError}}</pre>
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
			} catch (e) {
				this.onError = e
				loading.close()
			}
			loading.close()
		}
	}
}
</script>
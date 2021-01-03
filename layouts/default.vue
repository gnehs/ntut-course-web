<template>
	<div>
		<vs-navbar center-collapsed v-model="active" not-line>
			<template #left>
				<span>
					<strong @click="$router.push('/')">🍤 北科課程好朋友</strong>
				</span>
			</template>
			<vs-navbar-item :active="active=='/'" to="/">首頁</vs-navbar-item>
			<vs-navbar-item :active="active=='/search'" to="/search" id="search">搜尋</vs-navbar-item>
			<template #right>109年第2學期</template>
		</vs-navbar>
		<div class="container">
			<Nuxt />
		</div>
	</div>
</template>
<script>
export default {
	data: () => ({
		active: '/'
	}),
	created() {
		localStorage['data-year'] = '109'
		localStorage['data-sem'] = '2'
		this.fetchCourse(localStorage['data-year'], localStorage['data-sem'])
		this.$router.beforeEach((to, from, next) => {
			console.log(to.path)
			this.active = to.path
			next();
		});
	},
	methods: {
		async fetchCourse(y, s) {
			let c = localStorage[`course-${y}-${s}`] || null
			const loading = this.$vs.loading()
			localStorage[`course-${y}-${s}`] = JSON.stringify((await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler/${y}/${s}/main.json`)).data)
			loading.close()
			if (!c)
				this.$vs.notification({
					color: 'primary',
					position: 'top-center',
					title: '資料下載完畢',
					text: `${y} 年第 ${s} 學期資料已下載完成，共 ${JSON.parse(localStorage[`course-${y}-${s}`]).length} 筆`
				})
		},
	}
}
</script>
<style lang="sass">
body
  background-color: #f4f7f8
  margin: 0
.container
  min-height: calc(100vh - 74px)
  padding-top: 74px
  width: 1024px
  max-width: 98%
  margin: 0 auto
</style>
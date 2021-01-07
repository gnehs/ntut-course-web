<template>
	<div id="app">
		<vs-navbar center-collapsed v-model="active" shadow fixed not-line>
			<template #left>
				<span style="cursor: pointer">
					<strong @click="$router.push('/')">🍤 北科課程好朋友</strong>
				</span>
			</template>
			<vs-navbar-item :active="active=='/'" to="/">首頁</vs-navbar-item>
			<vs-navbar-item
				:active="active=='/search'"
				:to="`/search?year=${$store.state.year}&sem=${$store.state.sem}`"
				id="search"
			>搜尋</vs-navbar-item>
			<template #right>
				<vs-select
					v-model="yearSemVal"
					@change="yearSemSelected"
					:disabled="Boolean($route.query.year)"
					v-if="yearSemItems"
				>
					<vs-option label="選擇學期" value="no" disabled>選擇學期</vs-option>
					<vs-option
						v-for="(item,i) in yearSemItems"
						:label="parseYearSemVal(item)"
						:value="item"
						:key="i"
					>{{parseYearSemVal(item)}}</vs-option>
				</vs-select>
			</template>
		</vs-navbar>
		<div class="container">
			<Nuxt />
		</div>
		<footer>
			<div class="lr-container">
				<div class="l">
					Developed by
					<a href="https://gnehs.net" target="_blank" style="margin-left: .2em">勝勝</a>
				</div>
				<div class="r">
					<a
						v-if="commitSha"
						:href="`https://github.com/gnehs/ntut-course-web/commit/${commitSha}`"
					>#{{ commitSha }}</a>
				</div>
			</div>
		</footer>
	</div>
</template>
<script>
import Vue from "vue";
export default {
	data: () => ({
		active: '/',
		yearSemItems: null,
		yearSemVal: '-1',
		commitSha: process.env.GITHUB_REF
	}),
	created() {
		String.prototype.trimEllip = function (length) {
			return this.length > length ? this.substring(0, length) + "..." : this;
		}
		Vue.prototype.$fetchCourse = async (y, s) => {
			//replace yr & sem if query seleted
			let { year, sem } = this.$route.query
			if (year && sem) {
				y = year
				s = sem
			}
			if (!y || !s) {
				let yearData = await this.$fetchYearData()
				// trying get from localStorage
				if (localStorage['data-year'] && localStorage['data-sem']) {
					y = localStorage['data-year']
					s = localStorage['data-sem']
				}
				if (!yearData[y] || !yearData[y].includes(s)) {
					let yrs = Object.keys(yearData)
					y = yrs[yrs.length - 1]
					s = yearData[y][0]
				}
			}
			this.yearSemVal = `${y}-${s}`
			let dataKey = `course_${y}_${s}`

			let loading
			try {
				if (!window[dataKey]) {
					loading = this.$vs.loading()
					window[dataKey] = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler/${y}/${s}/main.json`)).data
					loading.close()
				}
				this.$store.commit('updateYear', y)
				this.$store.commit('updateSem', s)
				return window[dataKey]
			} catch (e) {
				this.$vs.notification({
					title: '擷取資料時發生了錯誤',
					text: e,
					color: 'danger'
				})
				loading.close()

				this.$store.commit('updateYear', '109')
				this.$store.commit('updateSem', '2')
			}
		};
		Vue.prototype.$fetchYearData = async () => {
			let key = `main_year`
			try {
				if (!localStorage[key]) {
					let res = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler/main.json`)).data
					localStorage[key] = JSON.stringify(res)
				}
				return JSON.parse(localStorage[key])
			} catch (e) {
				this.$vs.notification({
					title: '擷取資料時發生了錯誤',
					text: e,
					color: 'danger'
				})
			}
		};
		this.initYearSem()
		this.$fetchCourse()
		this.$router.beforeEach((to, from, next) => {
			this.active = to.path
			next();
		});
	},
	methods: {
		async initYearSem() {
			let d = await this.$fetchYearData()
			let res = []
			for (let year of Object.keys(d).reverse()) {
				for (let sem of d[year].reverse()) {
					res.push(`${year}-${sem}`)
				}
			}
			this.yearSemItems = res
		},
		parseYearSemVal(v) {
			let s = v.split('-')
			return `${s[0]} 年${s[1] == '1' ? '上' : '下'}學期`
		},
		yearSemSelected() {
			let s = this.yearSemVal.split('-')
			this.$fetchCourse(s[0], s[1])
		}
	}
}
</script>
<style lang="sass">
body
	background-color: #f4f7f8
	margin: 0
#app
	display: flex
	flex-direction: column
	min-height: 100vh
	.container
		flex: 1
		padding-top: 74px
		width: 1024px
		max-width: 97%
		margin: 0 auto
	footer
		margin: 0 auto
		margin-top: 10px
		text-align: center
		font-size: .85rem
		opacity: .7
		padding: 12px 15px
		width: 100%
		background: #FFF

		border-radius: 15px 15px 0px 0px
		box-shadow: 0px 5px 25px 0px rgba(0, 0, 0, var(--vs-shadow-opacity))
</style>
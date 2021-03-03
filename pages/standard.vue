<template>
	<div v-if="years">
		<vs-alert v-show="onError">
			<template #title>發生了錯誤</template>
			<pre>{{onError||'Error'}}</pre>
		</vs-alert>
		<template v-if="year">
			<h3>
				已選擇的項目
				<span style="font-size: 0.8em;opacity: .7;font-weight: normal;">點擊來取消</span>
			</h3>

			<div class="cards" style="--card-row: 5;--card-row-sm: 3">
				<card class="hoverable padding" @click.native="year=null" :disabled="system">
					<card-title>{{year}}</card-title>
					<p>年</p>
				</card>
				<card
					class="hoverable padding"
					@click.native="system=null"
					v-if="system"
					:disabled="department"
				>
					<card-title>{{system}}</card-title>
					<p>學制</p>
				</card>
				<card class="hoverable padding" @click.native="department=null" v-if="department">
					<card-title>{{department}}</card-title>
					<p>學制</p>
				</card>
			</div>
		</template>
		<template v-if="!year">
			<h3>選擇入學年度</h3>
			<div class="cards" style="--card-row: 5;--card-row-sm: 3">
				<card v-for="item of years" :key="item" class="hoverable padding" @click.native="year=item">
					<card-title>{{item}}</card-title>
					<p>年</p>
				</card>
			</div>
		</template>
		<template v-if="standardData">
			<template v-if="!system&&year">
				<h3>選擇學制</h3>
				<div class="cards" style="--card-row: 5;--card-row-sm: 3">
					<card
						v-for="item of Object.keys(standardData)"
						:key="item"
						class="hoverable padding"
						@click.native="system=item"
					>
						<card-title>{{item}}</card-title>
						<p>學制</p>
					</card>
				</div>
			</template>
			<template v-if="system&&!department">
				<h3>選擇系所</h3>
				<div class="cards" style="--card-row: 5;--card-row-sm: 3">
					<card
						v-for="item of Object.keys(standardData[system]).sort((a, b)=>a.localeCompare(b)).sort((a, b)=>a.length-b.length)"
						:key="item"
						class="hoverable padding"
						@click.native="department=item"
					>
						<card-title>{{item}}</card-title>
						<p>系所</p>
					</card>
				</div>
			</template>
			<template v-if="department">
				<h3>{{department}}</h3>
				<div class="cards" style="--card-row: 5;--card-row-sm: 3">
					<card v-for="item of Object.entries(standardData[system][department].credits)" :key="item[0]">
						<card-title>{{item[1]}}</card-title>
						<p>{{item[0]}}</p>
					</card>
				</div>
				<h3>相關規定事項</h3>
				<ul>
					<li v-for="item of standardData[system][department].rules" :key="item">{{item}}</li>
				</ul>
				<!--<pre>{{standardData[system][department]}}</pre>-->
			</template>
		</template>
	</div>
</template> 
<script>
export default {
	async created() {
		this.fetchYearsData()
		if (this.year) {
			await this.fetchYearData(this.year)
		}
	},
	data: () => ({
		onError: null,
		years: null,
		standardData: null,
	}),
	head() {
		return {
			title: '課程標準'
		}
	},
	computed: {
		year: {
			get: function () {
				return this.$route.query.year
			},
			set: function (val) {
				let query = Object.assign({}, this.$route.query)
				if (val) {
					query.year = val
					this.fetchYearData(val)
				}
				else {
					delete query.year
				}
				this.$router.push({ path: "/standard", query }, () => { });
			}
		},
		system: {
			get: function () {
				return this.$route.query.system
			},
			set: function (val) {
				let query = Object.assign({}, this.$route.query)
				if (val) {
					query.system = val
				}
				else {
					delete query.system
				}
				this.$router.push({ path: "/standard", query }, () => { });
			}
		},
		department: {
			get: function () {
				return this.$route.query.department
			},
			set: function (val) {
				let query = Object.assign({}, this.$route.query)
				if (val) {
					query.department = val
				}
				else {
					delete query.department
				}
				this.$router.push({ path: "/standard", query }, () => { });
			}
		},
	},
	methods: {
		async fetchYearsData() {
			const loading = this.$vs.loading()
			try {
				this.years = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler-node/standards.json`)).data
				loading.close()
			} catch (e) {
				this.onError = e
				loading.close()
			}
		},
		async fetchYearData(yr) {
			const loading = this.$vs.loading()
			try {
				this.standardData = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler-node/${yr}/standard.json`)).data
				loading.close()
			} catch (e) {
				this.onError = e
				loading.close()
			}
		},

	}
}
</script>

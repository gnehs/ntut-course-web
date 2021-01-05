<template>
	<div v-if="filteredDepartmentData">
		<h1>選擇班級</h1>
		<div style="padding: 16px;background:#FFF;border-radius: 8px;">
			<span>輸入關鍵字來篩選</span>
			<vs-input v-model="filterDapartmentVal" @input="filterDapartment" />
		</div>
		<div v-for="(department,i) in filteredDepartmentData" :key="department.name">
			<h3>{{department.name}}</h3>
			<div class="cards">
				<card
					v-for="({name},j) in department.class"
					:key="name"
					@click.native="$router.push(`class/${name}?year=${$store.state.year}&sem=${$store.state.sem}`)"
					style="--card-row: 5;--card-row-sm: 3"
				>
					<card-title>{{name}}</card-title>
					<p>{{department.name}}</p>
				</card>
			</div>
		</div>
	</div>
</template> 
<script>
export default {
	created() {
		this.fetchData()
	},
	data: () => ({
		departmentData: null,
		filteredDepartmentData: null,
		filterDapartmentVal: null
	}),
	methods: {
		async fetchData() {
			const loading = this.$vs.loading()
			this.departmentData = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler/${localStorage['data-year']}/${localStorage['data-sem']}/department.json`)).data
			this.filteredDepartmentData = this.departmentData
			loading.close()
		},
		filterDapartment() {
			let val = this.filterDapartmentVal
			if (val != '') {
				this.filteredDepartmentData =
					this.departmentData
						.filter(x => x.name.match(val) || x.class.map(x => x.name).join('').match(val))
						.map(x => {
							x.class = x.class.filter(y => y.name.match(val))
							return x
						})
						.filter(x => x.class.length)
			}
			else {
				this.filteredDepartmentData = this.departmentData
			}
		},
		generateRandomColor(i, j) {
			let r, g, b
			r = i * 929 % 50 + (255 - 40)
			g = i * 199 % 50 + (255 - 40)
			b = i * 680 % 50 + (255 - 40)
			return `rgb(${r},${g},${b})`
		}
	}
}
</script>

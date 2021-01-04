<template>
	<div>
		<h1>{{classname}}</h1>
		<vs-alert v-show="onError">
			<template #title>擷取資料時發生了錯誤</template>
			<pre>{{onError}}</pre>
		</vs-alert>
		<vs-table striped v-if="result">
			<template #thead>
				<vs-tr>
					<vs-th>課程名稱</vs-th>
					<vs-th>上課時間</vs-th>
					<vs-th>學分</vs-th>
					<vs-th>班級</vs-th>
					<vs-th>教室</vs-th>
					<vs-th>備註</vs-th>
					<vs-th>課號</vs-th>
				</vs-tr>
			</template>
			<template #tbody>
				<vs-tr
					:key="tr.id"
					v-for="tr in $vs.getPage(result, page, max)"
					:data="tr"
					@click="$router.push(`/course/${tr.id}?year=${$store.state.year}&sem=${$store.state.sem}`)"
				>
					<vs-td>{{tr.courseType}}{{ tr.name.zh }}</vs-td>
					<vs-td v-html="parseTime(tr.time)" />
					<vs-td>{{ tr.credit }}</vs-td>
					<vs-td>{{ tr.class.map(x=>x.name).join('、') }}</vs-td>
					<vs-td>{{ tr.classroom.map(x=>x.name).join('、') }}</vs-td>
					<vs-td>{{ tr.notes }}</vs-td>
					<vs-td>{{ tr.id }}</vs-td>
				</vs-tr>
			</template>
			<template #footer>
				<vs-pagination v-model="page" :length="$vs.getLength(result, max)" />
			</template>
		</vs-table>
	</div>
</template>
  
<script>
export default {
	data: () => ({
		onError: null,
		result: null,
		classname: null,
		max: 50,
		page: 1
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
		},
		parseTime(t) {
			let result = []
			let eng2zh = { "sun": '日', "mon": '一', "tue": '二', "wed": '三', "thu": '四', "fri": '五', "sat": '六' }
			for (let i of Object.entries(t)) {
				if (i[1].length)
					result.push(`${eng2zh[i[0]]}：${i[1].join('、')}`)
			}
			return result.join('</br>')
		}
	}
}
</script>
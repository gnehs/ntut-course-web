<template>
	<div>
		<h1>搜尋</h1>
		<div style="padding: 16px;background:#FFF;border-radius: 8px;">
			<span>關鍵字</span>
			<vs-input v-model="searchVal" @input="searchCourse" />
		</div>
		<vs-table striped v-if="searchResult">
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
					v-for="(tr, i) in $vs.getPage(searchResult, page, max)"
					:data="tr"
					@click="$router.push(`/course/${tr.id}`)"
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
				<vs-pagination v-model="page" :length="$vs.getLength(searchResult, max)" />
			</template>
		</vs-table>
	</div>
</template>
  
<script>
export default {
	data: () => ({
		searchVal: '',
		searchResult: null,
		max: 50,
		page: 1
	}),
	created() {

	},
	methods: {
		searchCourse() {
			let course = JSON.parse(localStorage[`course-${localStorage['data-year']}-${localStorage['data-sem']}`])
			if (this.searchVal != '')
				course = course.filter(x => x.name.zh.match(this.searchVal))

			this.searchResult = course
		},
		parseTime(t) {
			let result = []
			let eng2zh = { "sun": '日', "mon": '一', "tue": '二', "wed": '三', "thu": '四', "fri": '五', "sat": '六' }
			for (let i of Object.entries(t)) {
				console.log(i)
				if (i[1].length)
					result.push(`${eng2zh[i[0]]}：${i[1].join('、')}`)
			}
			return result.join('</br>')
		}
	}
}
</script>
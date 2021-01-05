<template>
	<div v-if="courses">
		<div class="center">
			<vs-button flat :active="layout == 'table'" @click="layout = 'table'">
				<i class="bx bx-table"></i>表格
			</vs-button>
			<vs-button flat :active="layout == 'card'" @click="layout = 'card'">
				<i class="bx bx-card"></i>卡片
			</vs-button>
		</div>
		<div v-if="layout == 'card'">
			<div class="cards">
				<card
					class="hoverable"
					v-for="tr in $vs.getPage(courses, page, max)"
					:key="tr.id"
					@click.native="$router.push(`/course/${tr.id}?year=${$store.state.year}&sem=${$store.state.sem}`)"
				>
					<card-title>{{ tr.courseType }}{{ tr.name.zh }}</card-title>

					<div class="cards">
						<card>
							<card-title>{{tr.id}}</card-title>
							<p>課號</p>
						</card>
						<card>
							<card-title>{{tr.credit}}</card-title>
							<p>學分</p>
						</card>
						<card v-for="item in parseTime(tr.time)" :key="item.title">
							<card-title>{{item.content}}</card-title>
							<p>{{item.title}}</p>
						</card>
						<card v-if="!parseTime(tr.time).length">
							<card-title>無資料</card-title>
							<p>上課時間</p>
						</card>
					</div>
					<p>
						班級：{{ tr.class.map(x=>x.name).join('、').trimEllip(9) }}
						<br />
						教師：{{ tr.teacher.map(y => y.name).join('、').trimEllip(13) }}
						<br />
						備註：{{ tr.notes.trimEllip(15) }}
					</p>
				</card>
			</div>
			<div class="center">
				<p v-if="!courses.length">查無資料</p>
			</div>
			<br />
			<vs-pagination v-model="page" :length="$vs.getLength(courses, max)" />
		</div>
		<card style="padding:0" v-if="layout == 'table'">
			<vs-table striped>
				<template #thead>
					<vs-tr>
						<vs-th>課號</vs-th>
						<vs-th>課程名稱</vs-th>
						<vs-th>教師</vs-th>
						<vs-th>班級</vs-th>
						<vs-th>備註</vs-th>
					</vs-tr>
				</template>
				<template #tbody>
					<vs-tr :key="tr.id" v-for="tr in $vs.getPage(courses, page, max)" :data="tr">
						<vs-td>{{ tr.id }}</vs-td>
						<vs-td>{{ tr.courseType }}{{ tr.name.zh }}</vs-td>
						<vs-td>{{ tr.teacher.map(y => y.name).join('、').trimEllip(9)}}</vs-td>
						<vs-td>{{ tr.class.map(x=>x.name).join('、').trimEllip(9) }}</vs-td>
						<vs-td>{{ tr.notes }}</vs-td>
						<template #expand>
							<div class="cards">
								<card>
									<card-title>{{tr.classroom.length?tr.classroom.map(x=>x.name).join('、'):'無資料'}}</card-title>
									<p>教室</p>
								</card>
								<div class="cards">
									<card>
										<card-title>{{tr.credit}}</card-title>
										<p>學分</p>
									</card>
									<card>
										<card-title>{{tr.hours}}</card-title>
										<p>時數</p>
									</card>
									<card>
										<card-title>{{tr.stage}}</card-title>
										<p>階段</p>
									</card>
								</div>
								<div class="cards">
									<card v-for="item in parseTime(tr.time)" :key="item.title">
										<card-title>{{item.content}}</card-title>
										<p>{{item.title}}</p>
									</card>
									<card v-if="!parseTime(tr.time).length">
										<card-title>無資料</card-title>
										<p>上課時間</p>
									</card>
								</div>
							</div>
							<div style="display:flex">
								<div style="flex:1" />
								<vs-button
									flat
									@click="$router.push(`/course/${tr.id}?year=${$store.state.year}&sem=${$store.state.sem}`)"
								>詳細資料</vs-button>
							</div>
						</template>
					</vs-tr>
				</template>
				<template #footer>
					<vs-pagination v-model="page" :length="$vs.getLength(courses, max)" />
				</template>
				<template #notFound>
					<p v-if="!courses.length">查無資料</p>
				</template>
			</vs-table>
		</card>
		<br />
		<br />
		<br />
	</div>
</template>
<style lang="sass" scoped>
.center
    display: flex
    align-items: center
    justify-content: center
    padding: 20px
    flex-wrap: wrap
</style>
<script>
export default {
	name: 'parse-courses',
	props: ['courses'],
	data: () => ({
		layout: 'card',
		max: 50,
		page: 1
	}),
	methods: {
		parseTime(t) {
			let result = []
			let eng2zh = { "sun": '週日', "mon": '週一', "tue": '週二', "wed": '週三', "thu": '週四', "fri": '週五', "sat": '週六' }
			for (let i of Object.entries(t)) {
				if (i[1].length)
					result.push({ title: eng2zh[i[0]], content: i[1].join('、') })
			}
			return result
		}
	}
}
</script>
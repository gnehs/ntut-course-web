<template>
	<div v-if="courses">
		<div class="center">
			<vs-button flat :active="layout == 'table'" @click="layout = 'table'">
				<i class="bx bx-table"></i>表格
			</vs-button>
			<vs-button flat :active="layout == 'card'" @click="layout = 'card'">
				<i class="bx bx-card"></i>卡片
			</vs-button>
			<vs-button
				flat
				:active="layout == 'timetable'"
				@click="layout = 'timetable'"
				v-if="showTimetable"
			>
				<i class="bx bx-time"></i>課表
			</vs-button>
		</div>
		<div v-if="layout == 'card'">
			<transition-group name="flip-card" tag="div" class="cards">
				<card
					class="hoverable padding"
					v-for="tr in $vs.getPage(showConflictCourse?courses:courses.filter(x=>!conflictCourseData.includes(x.id)), page, max)"
					:key="tr.id"
					@click.native="$router.push(`/course/${tr.id}?year=${$store.state.year}&sem=${$store.state.sem}`)"
				>
					<card-title>{{ tr.courseType }}{{ tr.name.zh }}</card-title>

					<div class="cards">
						<card class="borderless">
							<card-title>{{tr.id}}</card-title>
							<p>課號</p>
						</card>
						<card class="borderless">
							<card-title>{{tr.credit}}</card-title>
							<p>學分</p>
						</card>
						<card v-for="item in parseTime(tr.time)" :key="item.title" class="borderless">
							<card-title>{{item.content}}</card-title>
							<p>{{item.title}}</p>
						</card>
						<card v-if="!parseTime(tr.time).length" class="borderless">
							<card-title>無資料</card-title>
							<p>上課時間</p>
						</card>
						<card v-if="conflictCourseData.includes(tr.id)" class="borderless">
							<card-title style="color:red">衝堂</card-title>
							<p>狀態</p>
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
			</transition-group>
			<div class="center">
				<p v-if="!courses.length">查無資料</p>
			</div>
			<br />
			<vs-pagination
				v-model="page"
				:length="$vs.getLength(showConflictCourse?courses:courses.filter(x=>!conflictCourseData.includes(x.id)), max)"
			/>
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
					<vs-tr
						:key="tr.id"
						v-for="tr in $vs.getPage(showConflictCourse?courses:courses.filter(x=>!conflictCourseData.includes(x.id)), page, max)"
						:data="tr"
					>
						<vs-td>{{ tr.id }}</vs-td>
						<vs-td>{{ tr.courseType }}{{ tr.name.zh }}</vs-td>
						<vs-td>{{ tr.teacher.map(y => y.name).join('、').trimEllip(9)}}</vs-td>
						<vs-td>{{ tr.class.map(x=>x.name).join('、').trimEllip(9) }}</vs-td>
						<vs-td>
							<span style="color:red" v-if="conflictCourseData.includes(tr.id)">衝堂</span>
							<span v-else>{{ tr.notes }}</span>
						</vs-td>
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
					<vs-pagination
						v-model="page"
						:length="$vs.getLength(showConflictCourse?courses:courses.filter(x=>!conflictCourseData.includes(x.id)), max)"
					/>
				</template>
				<template #notFound>
					<p
						v-if="!(showConflictCourse?courses:courses.filter(x=>!conflictCourseData.includes(x.id))).length"
					>查無資料</p>
				</template>
			</vs-table>
		</card>
		<card style="padding:0;overflow:hidden" v-if="layout == 'timetable'">
			<div class="timetable">
				<div class="header">
					<div class="item"></div>
					<div class="item">一</div>
					<div class="item">二</div>
					<div class="item">三</div>
					<div class="item">四</div>
					<div class="item">五</div>
				</div>
				<div class="content" v-for="time in timetable" :key="time">
					<div class="item">{{ time }}</div>
					<div class="item" v-for="date in Object.keys(dateEng2zh).slice(1, 5+1)" :key="date">
						<template
							v-if="$vs.getPage(courses, page, max).filter(x=>x.time[date].includes(time)).length<=2"
						>
							<div
								class="course"
								:class="{conflict:conflictCourseData.includes(item.id)}"
								v-for="item in $vs.getPage(showConflictCourse?courses:courses.filter(x=>!conflictCourseData.includes(x.id)), page, max).filter(x=>x.time[date].includes(time))"
								:key="item.id"
								@click="$router.push(`/course/${item.id}?year=${$store.state.year}&sem=${$store.state.sem}`)"
							>{{item.name.zh}}</div>
						</template>
						<template v-else>
							<div class="course">課程數量過多無法顯示</div>
						</template>
					</div>
				</div>
			</div>
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
.timetable
	font-size: .85em
	.header
		top: 0
		position: sticky
		.item
			padding: 10px 12px
			background: #f2f2f2
			text-align: center
	.content
		&:nth-child(2n)
			background: rgba(var(--vs-gray-1), 1)
		.item
			display: flex
			padding: 2px
			.course
				cursor: pointer
				width: 100%
				--main-color: 25, 91, 255
				background: rgba(var(--main-color), 0.15)
				color: rgb(var(--main-color))
				padding: 12px 6px
				padding-right: 2px
				border-radius: 0 8px 8px 0
				transition: all .25s ease
				height: 100%
				margin: 2px
				display: flex
				align-items: center
				position: relative
				&.conflict
					--main-color: 255, 44, 44
				&:before
					content: ""
					background: rgb(var(--main-color))
					left: 0px
					top: 0px
					width: 2px
					height: 100%
					position: absolute
					transition: all .1s linear

				&:hover
					padding: 12px 8px
					padding-right: 0px
					&:before
						width: 4px
				&:active
					transform: scale(.9)
	.header,.content
		display: grid
		grid-template-columns: 1.25em repeat(5, 1fr)
		.item
			min-height: 40px
			&:first-child
				background: #f2f2f2
				font-size: 1.15em
				display: flex
				align-items: center
				justify-content: center
</style>
<script>
import card from './card.vue'
export default {
	components: { card },
	name: 'parse-courses',
	props: {
		courses: Array,
		showTimetable: {
			type: Boolean,
			default: false
		},
		showConflictCourse: {
			type: Boolean,
			default: true
		}
	},
	data: () => ({
		layout: 'card',
		max: 50,
		page: 1,
		conflictCourseData: [],
		timetable: ['1', '2', '3', '4', 'N', '5', '6', '7', '8', '9', 'A', 'B', 'C'],
		dateEng2zh: { "sun": '週日', "mon": '週一', "tue": '週二', "wed": '週三', "thu": '週四', "fri": '週五', "sat": '週六' }
	}),
	mounted() {
		this.checkIsCourseConflict()
	},
	watch: {
		courses(newCount, oldCount) {
			this.checkIsCourseConflict()
		},
	},
	methods: {
		parseTime(t) {
			let result = []
			for (let i of Object.entries(t)) {
				if (i[1].length)
					result.push({ title: this.dateEng2zh[i[0]], content: i[1].join('、') })
			}
			return result
		},
		async checkIsCourseConflict() {
			this.conflictCourseData = await this.$checkConflictedCourse(this.courses)
		}
	}
}
</script>
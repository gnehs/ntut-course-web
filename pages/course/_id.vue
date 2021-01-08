<template>
	<div>
		<vs-alert v-show="onError">
			<template #title>擷取資料時發生了錯誤</template>
			<pre>{{onError||'Error'}}</pre>
		</vs-alert>
		<div v-if="fetchedCourseData&&courseData">
			<div class="lr-container">
				<div class="l">
					<h2>
						{{courseData.name.zh}}
						<br />
						{{courseData.name.en}}
					</h2>
				</div>
				<div class="r">
					<vs-button flat @click="add2myCourse" v-if="!isInMyCourse">
						<i class="bx bx-plus"></i>加入我的課程
					</vs-button>
					<vs-button flat danger @click="removeFromMyCourse" v-else>
						<i class="bx bx-minus"></i>從我的課程移除
					</vs-button>
				</div>
			</div>
			<vs-alert danger v-show="isCourseConflicted">
				<template #title>課程衝堂</template>
				本課程與
				<span v-for="(item,i) in conflictCourseData" :key="item.id">
					<span v-if="i>0">、</span>
					<a
						style="cursor: pointer;"
						@click="$router.push(`/course/${item.id}?year=${$store.state.year}&sem=${$store.state.sem}`)"
					>{{item.name.zh}}</a>
				</span> 衝堂！
			</vs-alert>
			<vs-alert v-show="isEarlyEight">該課程為早八，選課前請先三思！</vs-alert>
			<div class="cards">
				<div class="cards">
					<card>
						<card-title>{{courseData.id}}</card-title>
						<p>課號</p>
					</card>
					<card>
						<card-title>{{courseData.peopleWithdraw}}</card-title>
						<p>撤選</p>
					</card>
					<card>
						<card-title>{{courseData.people}}</card-title>
						<p>人數</p>
					</card>
				</div>
				<div class="cards">
					<card>
						<card-title>{{courseData.credit}}</card-title>
						<p>學分</p>
					</card>
					<card>
						<card-title>{{courseData.hours}}</card-title>
						<p>時數</p>
					</card>
					<card>
						<card-title>{{courseData.stage}}</card-title>
						<p>階段</p>
					</card>
				</div>
				<card>
					<card-title>{{courseData.courseType}} {{courseStandard[courseData.courseType]}}</card-title>
					<p>課程標準</p>
				</card>
				<card>
					<card-title>{{courseData.class.map(x=>x.name).join('、')}}</card-title>
					<p>班級</p>
				</card>
				<card>
					<card-title>{{courseData.classroom.length?courseData.classroom.map(x=>x.name).join('、'):'無資料'}}</card-title>
					<p>教室</p>
				</card>
				<div class="cards">
					<card v-for="item in parseTime(courseData.time)" :key="item.title">
						<card-title>{{item.content}}</card-title>
						<p>{{item.title}}</p>
					</card>
					<card v-if="!parseTime(courseData.time).length">
						<card-title>無資料</card-title>
						<p>上課時間</p>
					</card>
				</div>
			</div>
			<h3>課程概述</h3>
			<p v-html="parseTextarea(courseData.description.zh)" />
			<p v-html="parseTextarea(courseData.description.en)" />
			<div v-if="courseData.notes.trim()!=''">
				<h3>備註</h3>
				<p v-html="parseTextarea(courseData.notes)" />
			</div>
			<div v-if="fetchedCourseData.length">
				<vs-alert shadow style="background:#FFF" v-show="chooseClassSelect">
					<template #title>含有多項資料</template>
					本課程含有多項資料可供查詢，請使用下拉式選單選取教師來查看資料。
					<br />
					<br />
					<br />
					<vs-select label="選擇教師" v-model="chooseClassIndex" v-show="chooseClassSelect">
						<vs-option
							v-for="(item,i) in fetchedCourseData.map(x=>x.name)"
							:label="fetchedCourseData.map(x=>x.name)[i]"
							:value="i.toString()"
							:key="i"
						>{{item}}</vs-option>
					</vs-select>
				</vs-alert>
				<div v-for="(item,i) in fetchedCourseData" :key="i.toString()">
					<div v-show="chooseClassIndex==i.toString()">
						<h3>教師</h3>
						<p>{{item.name}} {{item.email}}</p>
						<h3>課程大綱</h3>
						<p v-html="parseTextarea(item.objective)" />
						<h3>課程進度</h3>
						<p v-html="parseTextarea(item.schedule)" />
						<h3>評量標準</h3>
						<p v-html="parseTextarea(item.scorePolicy)" />
						<h3>使用教材、參考書目或其他</h3>
						<p v-html="parseTextarea(item.materials)" />
						<h3>使用原文書籍：{{item.foreignLanguageTextbooks?"是":"否"}}</h3>
						<h3>最後更新：{{item.latestUpdate}}</h3>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
  
<script>
export default {
	data: () => ({
		onError: false,
		isEarlyEight: false,
		isInMyCourse: false,
		isCourseConflicted: false,
		conflictCourseData: [],
		chooseClassIndex: '0',
		chooseClassSelect: false,
		fetchedCourseData: null,
		courseData: [],
		courseStandard: {
			'○': '部訂共同必修',
			'△': '校訂共同必修',
			'☆': '共同選修',
			'●': '部訂專業必修',
			'▲': '校訂專業必修',
			'★': '專業選修'
		}
	}),
	created() {
		this.fetchData()
	},
	methods: {
		async fetchData() {
			let courseId = this.$route.params.id
			let { year, sem } = this.$route.query
			const loading = this.$vs.loading()
			try {
				let course = await this.$fetchCourse(year, sem)
				this.courseData = course.filter(x => x.id == courseId)[0]
				this.checkCourseInMyCourse()
				this.checkIsCourseConflict()
				this.fetchedCourseData = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler/${year}/${sem}/course/${courseId}.json`)).data
				if (this.fetchedCourseData.length > 1) {
					this.chooseClassSelect = true
				}
			} catch (e) {
				this.onError = e
				loading.close()
			}
			loading.close()
		},
		parseTextarea(t) {
			t = t.replace(/\t/g, '　　')
			t = t.replace(/\r\n/g, '<br/>')
			return t
		},
		parseTime(t) {
			let result = []
			let eng2zh = { "sun": '週日', "mon": '週一', "tue": '週二', "wed": '週三', "thu": '週四', "fri": '週五', "sat": '週六' }
			for (let i of Object.entries(t)) {
				if (i[1].length) {
					if (i[1].includes('1')) this.isEarlyEight = true
					result.push({ title: eng2zh[i[0]], content: i[1].join('、') })
				}
			}
			return result
		},
		checkCourseInMyCourse() {
			this.isInMyCourse = this.$checkIsInCourse(this.courseData.id)
		},
		async checkIsCourseConflict() {
			let { year, sem } = this.$route.query
			let conflictCourseIds = await this.$checkConflictedCourse([this.courseData])
			for (let course of (await this.$fetchCourse(year, sem))) {
				if (conflictCourseIds.includes(course.id) && course.id != this.courseData.id) {
					this.conflictCourseData.push(course)
				}
			}
			this.isCourseConflicted = conflictCourseIds.length > 0
		},
		add2myCourse() {
			this.$addCourse(this.courseData.id)
			this.isInMyCourse = true
			this.$vs.notification({
				title: '加入完成！',
				text: `已將「${this.courseData.name.zh}」加入到我的課程`
			})
		},
		removeFromMyCourse() {
			this.$removeCourse(this.courseData.id)
			this.isInMyCourse = false
			this.$vs.notification({
				title: '已移除',
				text: `已將「${this.courseData.name.zh}」從我的課程中移除`
			})
		}
	}
}
</script>
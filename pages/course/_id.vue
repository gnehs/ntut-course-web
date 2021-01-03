<template>
	<div>
		<vs-alert v-show="onError">
			<template #title>擷取資料時發生了錯誤</template>
			<pre>{{onError}}</pre>
		</vs-alert>
		<div v-if="fetchedCourseData&&courseData">
			<h2>
				{{courseData.name.zh}}
				<br />
				{{courseData.name.en}}
			</h2>
			<div class="cards">
				<vs-card>
					<template #title>
						<h3>{{courseData.class.map(x=>x.name).join('、')}}</h3>
					</template>
					<template #text>
						<p>班級</p>
					</template>
				</vs-card>
				<vs-card>
					<template #title>
						<h3>{{courseData.classroom.length?courseData.classroom.map(x=>x.name).join('、'):'無資料'}}</h3>
					</template>
					<template #text>
						<p>教室</p>
					</template>
				</vs-card>
				<vs-card>
					<template #title>
						<h3>{{courseData.stage}}</h3>
					</template>
					<template #text>
						<p>階段</p>
					</template>
				</vs-card>
				<vs-card>
					<template #title>
						<h3>{{courseData.hours}}/{{courseData.credit}}</h3>
					</template>
					<template #text>
						<p>時數/學分</p>
					</template>
				</vs-card>
				<vs-card>
					<template #title>
						<h3>{{courseData.peopleWithdraw}}/{{courseData.people}}</h3>
					</template>
					<template #text>
						<p>撤選/人數</p>
					</template>
				</vs-card>
				<vs-card>
					<template #title>
						<h3>{{parseTime(courseData.time)}}</h3>
					</template>
					<template #text>
						<p>上課時間</p>
					</template>
				</vs-card>
			</div>
			<h3>課程概述</h3>
			<p v-html="parseTextarea(courseData.description.zh)" />
			<p v-html="parseTextarea(courseData.description.en)" />
			<div v-for="item in fetchedCourseData" :key="item">
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
			<h3>備註</h3>
			<p v-html="parseTextarea(courseData.notes)" />
		</div>
	</div>
</template>
  
<script>
export default {
	data: () => ({
		onError: false,
		fetchedCourseData: null,
		courseData: null
	}),
	created() {
		this.fetchData()
	},
	methods: {
		async fetchData() {
			let courseId = this.$route.params.id
			const loading = this.$vs.loading()
			try {
				let course = JSON.parse(localStorage[`course-${localStorage['data-year']}-${localStorage['data-sem']}`])
				this.courseData = course.filter(x => x.id == courseId)[0]
				this.fetchedCourseData = (await this.$axios.get(`https://gnehs.github.io/ntut-course-crawler/${localStorage['data-year']}/${localStorage['data-sem']}/course/${courseId}.json`)).data
			} catch (e) {
				this.onError = e
				loading.close()
			}
			loading.close()
		},
		parseTextarea(t) {
			t = t.replace(/\t/g, '   ')
			t = t.replace(/\r\n/g, '<br/>')
			return t
		},
		parseTime(t) {
			let result = []
			let eng2zh = { "sun": '週日', "mon": '週一', "tue": '週二', "wed": '週三', "thu": '週四', "fri": '週五', "sat": '週六' }
			for (let i of Object.entries(t)) {
				console.log(i)
				if (i[1].length)
					result.push(`${eng2zh[i[0]]}：${i[1].join('、')}`)
			}
			return result.join(';')
		}
	}
}
</script>
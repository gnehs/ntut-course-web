<template>
	<div>
		<vs-alert shadow style="background:#FFF">
			<template #title>僅供參考</template>
			本站資料擷取自
			<a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a>，資料僅供參考之用，正式資料仍以學校公佈為主。
		</vs-alert>
		<br />
		<div class="cards">
			<card
				class="hoverable"
				@click.native="$router.push(`/search?year=${$store.state.year}&sem=${$store.state.sem}`)"
			>
				<card-title>搜尋課程</card-title>
				<p>根據課號、關鍵字或是教師等資訊搜尋課程</p>
			</card>
			<card class="hoverable" @click.native="$router.push(`/class`)">
				<card-title>上課時間表</card-title>
				<p>查看班級上課時間表</p>
			</card>
			<card class="hoverable" @click.native="$router.push('/api')">
				<card-title>API 手冊</card-title>
				<p>探索本站開放公眾使用的開放資料</p>
			</card>
			<card class="hoverable" @click.native="$router.push('/about')">
				<card-title>關於</card-title>
				<p>關於本網站</p>
			</card>
		</div>
	</div>
</template>
  
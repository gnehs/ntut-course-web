<template>
	<div>
		<vs-alert relief>
			<template #title>免責聲明</template>
			本站資料擷取自
			<a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a>，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
		</vs-alert>
		<br />
		<div class="cards">
			<card
				class="hoverable padding"
				@click.native="$router.push(`/search?year=${$store.state.year}&sem=${$store.state.sem}`)"
			>
				<card-title>搜尋課程</card-title>
				<p>依課號、關鍵字或教師搜尋課程</p>
				<i class="bx bx-search"></i>
			</card>
			<card class="hoverable padding" @click.native="$router.push(`/class`)">
				<card-title>上課時間表</card-title>
				<p>查看各班上課時間表</p>
				<i class="bx bx-time"></i>
			</card>
			<card class="hoverable padding" @click.native="$router.push('/my-course')">
				<card-title>我的課程</card-title>
				<p>查看已儲存的課程</p>
				<i class="bx bx-user"></i>
			</card>
			<card class="hoverable padding" @click.native="$router.push('/api')">
				<card-title>API 手冊</card-title>
				<p>探索開放公眾使用的資料</p>
				<i class="bx bx-data"></i>
			</card>
			<card class="hoverable padding" @click.native="$router.push('/about')">
				<card-title>關於</card-title>
				<p>關於本網站</p>
				<i class="bx bx-info-circle"></i>
			</card>
		</div>
	</div>
</template>
  
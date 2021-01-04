<template>
	<div>
		<vs-alert shadow style="background:#FFF">
			<template #title>僅供參考</template>
			本站資料擷取自
			<a href="https://aps.ntut.edu.tw/course/tw/course.jsp" target="_blank">國立臺北科技大學課程系統</a>，資料僅供參考之用，正式資料仍以學校公佈為主。
		</vs-alert>
		<br />
		<div class="cards">
			<vs-card @click="$router.push(`/search?year=${$store.state.year}&sem=${$store.state.sem}`)">
				<template #title>
					<h3>搜尋課程</h3>
				</template>
				<template #text>
					<p>根據課號、關鍵字或是教師等資訊搜尋課程</p>
				</template>
			</vs-card>
			<vs-card @click="$router.push(`/class?year=${$store.state.year}&sem=${$store.state.sem}`)">
				<template #title>
					<h3>上課時間表</h3>
				</template>
				<template #text>
					<p>查看班級上課時間表</p>
				</template>
			</vs-card>
			<vs-card @click="$router.push('/api')">
				<template #title>
					<h3>API 手冊</h3>
				</template>
				<template #text>
					<p>探索本站開放公眾使用的開放資料</p>
				</template>
			</vs-card>
			<vs-card @click="$router.push('/about')">
				<template #title>
					<h3>關於</h3>
				</template>
				<template #text>
					<p>關於本網站</p>
				</template>
			</vs-card>
		</div>
	</div>
</template>
  
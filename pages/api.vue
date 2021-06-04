<template lang="md">
# API 文件
## 注意
- 這不是學校官方提供的 API
- 這份文件非即時更新，可能會有 API 失效 
- 資料擷取自 [國立臺北科技大學課程系統](https://aps.ntut.edu.tw/course/tw/course.jsp)，資料僅供參考，可能會有所遺漏或錯誤，正式資料仍以學校公佈為主。
## 來試試看吧！
你可以使用 [Hoppscotch](https://hoppscotch.io/?method=GET&url=https://gnehs.github.io&path=/ntut-course-crawler-node/main.json) 或 [Postman](https://www.postman.com/) 來發起請求。

-------

## API Endpoint
### Endpoint
https://gnehs.github.io/ntut-course-crawler-node/  
### 說明
如果你想取得 `/main.json` 的資料，請將 `Endpoint` 加在其前方。

就像這樣：`https://gnehs.github.io/ntut-course-crawler-node/main.json`  

-------
# API 清單
## 課程
這裡是與課程相關的 API
<div class="white-box">

### `/main.json` 取得所有可用之年份與學期 
#### Example
https://gnehs.github.io/ntut-course-crawler-node/main.json

</div><div class="white-box">

### `/{year}/{sem}/{system}.json` 取得某學期某學制課程資料 
#### 注意
該檔案非常大，可能有機會無法解析
#### Example
https://gnehs.github.io/ntut-course-crawler-node/109/2/進修部.json
#### 參數
- `year` 民國年
- `sem` 學期
	- `1` 上學期
	- `2` 下學期
- `system` 學制
	- `main` 
		- 註：日間部被重新命名為 main
	- `研究所(日間部、進修部、週末碩士班)`
	- `進修部`

</div><div class="white-box">

### `/{year}/{sem}/course/{id}.json` 取得課程詳細資料
#### Example
https://gnehs.github.io/ntut-course-crawler-node/109/2/course/281841.json
#### 參數
- `year` 民國年
- `sem` 學期
	- `1` 上學期
	- `2` 下學期
- `id` - 課程編號

</div>

## 系所班級

<div class="white-box">

### `/{year}/{sem}/department.json` 取得系所班級清單
#### Example
https://gnehs.github.io/ntut-course-crawler-node/109/2/department.json
#### 參數
- `year` 民國年
- `sem` 學期
	- `1` 上學期
	- `2` 下學期

</div>

## 課程標準
<div class="white-box">

### `/standards.json` 取得課程標準可用年份
#### Example
https://gnehs.github.io/ntut-course-crawler-node/standards.json

</div><div class="white-box">

### `/{year}/standard.json` 取得當年度入學之課程標準
#### Example
https://gnehs.github.io/ntut-course-crawler-node/110/standard.json
#### 參數
- `year` 民國年

</div>
</template> 
<style scoped lang="sass">
img
	max-width: 100%

h1
	font-size: 2em

.white-box
	background: #fff
	padding: 8px 16px
	margin: 8px 0
	border-radius: 8px
</style>
<script>
export default {
    head() {
        return {
            title: 'API 手冊'
        }
    }
}
</script>
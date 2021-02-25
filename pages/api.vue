<template>
	<div>
		<h1>API 手冊</h1>
		<p>
			如果你使用 Chrome，可以使用
			<a
				href="https://chrome.google.com/webstore/detail/json-formatter/bcjindcccaagfpapjjmafapmmgkkhgoa?hl=zh_tw"
				target="_blank"
			>JSON Formatter</a> 來檢視 JSON 檔案
		</p>
		<p>API Endpoint: https://gnehs.github.io/ntut-course-crawler-node/{API}</p>
		<p>
			source code:
			<a
				href="https://github.com/gnehs/ntut-course-crawler-node"
				target="_blank"
			>https://github.com/gnehs/ntut-course-crawler-node</a>
		</p>
		<h2>
			GET
			<code>/main.json</code>
		</h2>
		<p>
			可取得所有可用年份與學期
			<br />
			<br />Example:
			<a
				href="https://gnehs.github.io/ntut-course-crawler-node/main.json"
				target="_blank"
			>https://gnehs.github.io/ntut-course-crawler-node/main.json</a>
		</p>
		<pre>
{
  "109": [
    "1",
    "2"
  ],
  "108": [
    "1",
    "2"
  ],
  ...
}</pre>
		<h2>
			GET
			<code>/{年份}/{學期}/{學制}.json</code>
		</h2>
		<p>
			取得該學期某一學制課程資料
			<br />你可以在此處查看所有可用之學制：
			<a
				href="https://github.com/gnehs/ntut-course-crawler-node/tree/gh-pages/109/2"
				target="_blank"
			>https://github.com/gnehs/ntut-course-crawler-node/tree/gh-pages/109/2</a>
			<br />＊日間部四技被重新命名為 main.json
			<br />
			<br />Example:
			<a
				href="https://gnehs.github.io/ntut-course-crawler-node/109/2/main.json"
				target="_blank"
			>https://gnehs.github.io/ntut-course-crawler-node/109/2/main.json</a>
			<br />＊請注意：該檔案非常大，可能有機會無法解析
		</p>
		<pre>
[
  {
    "id":"281711",
    "code":"1004002",
    "name":{
      "zh":"體育",
      "en":"Physical Education"
    },
    "description":{
      "zh":"本校體育課程目標為鍛鍊健全身心有專長...",
      "en":"In second semester, Senior student..."
    },
    "stage":"1",
    "credit":"1.0",
    "hours":"2",
    "courseType":"☆",
    "class":[{
      "name":"機械四甲",
      "link":"Subj.jsp?format=-4&ye...",
      "code":"2171"
    }],
    "teacher":[],
    "time":{
      "sun":[],
      "mon":[],
      "tue":[],
      "wed":[],
      "thu":[],
      "fri":[],
      "sat":[]
    },
    "classroom":[],
    "people":"0",
    "peopleWithdraw":"0",
    "ta":[],
    "language":"",
    "notes":""
  },
  ...
]</pre>
		<h2>
			GET
			<code>/{年份}/{學期}/course/{id}.json</code>
		</h2>
		<p>
			取得課程詳細資料
			<br />
			<br />Example:
			<a
				href="https://gnehs.github.io/ntut-course-crawler-node/109/2/course/281841.json"
				target="_blank"
			>https://gnehs.github.io/ntut-course-crawler-node/109/2/course/281841.json</a>
		</p>
		<pre>[
  {
      "name": "林小媛",
      "email": "...",
      "latestUpdate": "2020-12-22 16:44:55",
      "objective": "使學生進一步瞭解首飾設計觀念，...",
      "schedule": "1. 課程簡介   [第1週]\r\n...",
      "materials": "‧「軟蠟變銀飾超簡單」，王美...",
      "foreignLanguageTextbooks": false
  }
]</pre>
	</div>
</template>
<style lang="sass" scoped>
pre
  background: #ffffff
  padding: 16px
  border-radius: 8px
  overflow-y: scroll
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
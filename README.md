# [🍤 北科課程好朋友](https://ntut-course.gnehs.net/)
這裡是北科課程好朋友，提供課程資訊的可愛網站！

## 關於
https://ntut-course.gnehs.net/about

## API 文件
https://ntut-course.gnehs.net/doc

## 爬蟲與資料
https://github.com/gnehs/ntut-course-crawler-node

## 環境變數

可透過 `BASE_URL` 環境變數指定 API 進入點，
未設定時預設為 `https://gnehs.github.io/ntut-course-crawler-node/`。

```bash
# 使用自訂的 API 進入點啟動開發伺服器
BASE_URL=https://example.com npm run dev
```

透過 `production/DOMAIN_NAME` 環境變數可指定 Github Pages 發行時的 CNAME。
未設定時預設為 `ntut-course.gnehs.net`，若無法適用，將降級為 Github 預設。

## Build Setup

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

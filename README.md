# [🍤 北科課程好朋友](https://ntut-course.gnehs.net/)

這裡是北科課程好朋友，提供課程資訊的可愛網站！

## 關於

https://ntut-course.gnehs.net/about

## API 文件

https://ntut-course.gnehs.net/doc

## 爬蟲與資料

https://github.com/gnehs/ntut-course-crawler-node

## 環境變數

可透過 `VITE_API_BASE` 環境變數指定 API 進入點，
未設定時預設為 `https://gnehs.github.io/ntut-course-crawler-node`。

```bash
# 使用自訂的 API 進入點啟動開發伺服器
VITE_API_BASE=https://example.com pnpm dev
```

Vite 只會把 `VITE_` 前綴的變數暴露給前端程式碼。

## Build Setup

```bash
# install dependencies
$ pnpm install

# serve with hot reload at localhost:7190
$ pnpm dev

# build for production and launch server
$ pnpm build
$ pnpm start

# run tests
$ pnpm test
```

## 技術棧

本站目前使用 React、Vite、Tailwind CSS 與 TanStack Router 建置。靜態資產放在 `static/`，應用程式入口在 `src/main.jsx`，路由定義在 `src/router.jsx`。

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

本站目前使用 React、Vite、Tailwind CSS 與 TanStack Router 建置。靜態資產放在 `static/`，應用程式入口在 `src/main.tsx`，路由定義在 `src/router.tsx`。

`static/` 內的檔案會直接複製到網站根目錄，例如 `static/robots.txt` 對應 `/robots.txt`。文件與設計原始檔不放在公開目錄；圖示設計原始檔保存在 `docs/design/icon.psd`。

## 課程資料功能

- 課程詳情包含授課語言、隨班附讀、實驗實習、跨領域、教師諮商時間與課綱原始連結；空白或無作用的欄位隱藏。
- 進階搜尋支援授課語言、AI 教學方式、SDGs 與課程屬性，使用每學期單一 `syllabus-index.json`，不逐門下載課綱。
- `/program` 提供一般學程；`/competencies` 提供系所核心能力對照。
- 新增 API 尚未發布的舊學期會顯示未提供資料，不將其視為沒有開課或沒有導入 AI。

欄位語意、相容性及驗證記錄請見 [欄位盤點](docs/course-field-audit.md)。

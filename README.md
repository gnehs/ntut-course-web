# [🍤 北科課程好朋友](https://ntut-course.gnehs.net/)

查北科課程、排課表的可愛網站！選課季救星，希望你今年也搶到想上的課 🙏

- 關於本站：<https://ntut-course.gnehs.net/about>
- API 文件：<https://ntut-course.gnehs.net/doc>
- 資料與爬蟲：<https://github.com/gnehs/ntut-course-crawler-node>

## 開始開發

```bash
pnpm install
pnpm dev        # http://localhost:7190
pnpm test
pnpm typecheck
pnpm build      # 輸出到 dist/
```

## 資料從哪來

網站本身不爬資料，髒活都交給爬蟲了，課程、學程等資料都由 [爬蟲](https://github.com/gnehs/ntut-course-crawler-node) 發布在 GitHub Pages，網站直接讀那裡的 JSON。

想換成別的資料來源，啟動時設定 `VITE_API_BASE`：

```bash
VITE_API_BASE=https://example.com pnpm dev
```

## 程式放在哪

| 位置 | 內容 |
| --- | --- |
| `src/routes/` | 各個頁面 |
| `src/components/` | 共用元件 |
| `src/lib/` | 讀取資料與工具函式 |
| `src/worker.ts`、`src/worker/` | Cloudflare Worker：分享連結的預覽資訊、預覽圖片、sitemap |
| `static/` | 原樣放到網站根目錄的檔案，例如 `static/robots.txt` 會變成 `/robots.txt` |
| `docs/` | 開發文件與設計原始檔 |

使用 React、Vite、Tailwind CSS 和 TanStack Router，網站部署在 Cloudflare Workers，設定在 `wrangler.jsonc`。

課程各欄位的意思與來源，請見 [欄位盤點](docs/course-field-audit.md)。

# 南柯紀事｜中國歷史・史料整理與討論

個人中國歷史編纂與共讀網站。保留「朝代 → 紀 → 紀事 → 小節 → 史料」結構，公開閱讀版由 `site-data.json` 產生，不讀取訪客的本機草稿。

## 新版內容

- 完整 HTML 正文與史料獨立網址，無 JavaScript 也能閱讀。
- 首頁介紹、站內全文搜尋、手機版目錄、文章分享、舊 `#/article/...` 連結轉址。
- 每篇文章可發起、查看 GitHub Issues 話題；任何人能讀，發言需要 GitHub 帳號。這是外連討論入口，尚未內嵌留言或建立獨立會員系統。
- 描述、canonical、Open Graph、結構化資料與 `sitemap.xml`。改善可發現性，不保證搜尋引擎收錄或排名。
- `editor.html` 為作者工作台，沿用 `nanke-jishi-draft-v2` 草稿鍵。工作台不是權限控制；瀏覽器修改只留在本機，不能寫入 GitHub。

## 首次上線（改版審閱後）

1. 先在現有工作台匯出最新 JSON 備份。如果本機草稿比已發布內容新，請保管好；本次改版以 GitHub 已發布資料為基礎，不會自動取得別台電腦草稿。
2. 專案 **Settings → Pages → Build and deployment → Source** 改成 **GitHub Actions**。
3. 合併改版分支到 `main`。`Build and publish Nanke Jishi` 會重建並發布 `_site`。PR 檢查只建置，不發布。
4. 確認 Actions 部署成功，測試首頁、文章、搜尋與話題連結。
5. 可在 Google Search Console 驗證現有網址前綴，提交 `https://kevinkcko8-svg.github.io/nanko/sitemap.xml`。此改版未代為驗證或提交。

若維持舊的分支發布模式，檔案仍能運作，但更新 JSON 後必須自行執行 `node scripts/build.mjs` 並提交所有產生的檔案；否則公開頁與搜尋不會更新。

## 平常編輯與發布

1. 網站頁尾 → 作者工作台 → 編輯與備份。
2. 編輯正文／分節史料，按「儲存此篇草稿」。建議另下載完整 JSON 備份。
3. 下載發布檔 `site-data.json`，上傳覆蓋 GitHub 專案同名檔案並提交至 `main`。
4. 設定好上述 Actions 後，獨立頁面、搜尋索引、網站地圖與工作台備援資料會自動重建發布；不需自己逐頁更新。

工作台讀取本機草稿優先於公開資料；公開新版不會刪除舊草稿。公開閱讀頁一律顯示已發布版本。

## 討論

目前既有儲存庫已啟用 Issues，未啟用 Discussions。新版直接使用 Issues：

- 本篇話題用穩定的 `[entry-id]` 標記搜尋，請保留發起表單預填的標記。
- 新討論表單預填文章網址、問題、出處、解讀欄位；讀者送出前仍可修改。
- 不自動發布話題或留言，不展示虛構會員數、討論數。
- 日後可再開啟 Discussions／設定 giscus；目前未安裝額外 GitHub App。

## 本機驗證

需 Node.js 22；建置無 npm 相依套件。

```sh
node scripts/build.mjs
node scripts/check.mjs
python -m http.server 8765
```

以 `http://localhost:8765/` 預覽。搜尋與發布資料載入需要 HTTP，不建議直接雙擊 HTML。`node scripts/package.mjs` 產生可部署的 `_site`。

公開網址與討論儲存庫目前設定於 `scripts/build.mjs`。若改網址，需同步修改並重建。保留原站名；目前未修改原始正文、史料或編排順序。

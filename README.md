# Exam Timer

考試計時器，可顯示當天考試科目與倒數時間。  
課表資料透過 Google Sheets 管理，編輯後自動同步至 GitHub。

<https://examtimer.onrender.com/>

![examtimer主畫面](/img/homepage.png)

---

## 功能

- 即時顯示目前時間
- 根據時間自動顯示當前／即將進行的科目及倒數
- 支援雙班級課表同時顯示（適合換班情境）
- 支援「(原)」標記，標示需回原班的科目
- 可手動新增、編輯、刪除科目
- 可上傳座位表圖片
- 支援全螢幕模式

---

## 資料流程

```
Google Sheets
     │
     │  編輯後自動觸發 Apps Script
     ▼
  GitHub (data/*.csv)
     │
     │  前端請求時由後端讀取
     ▼
  Exam Timer
```

各班級課表存放於 Google Sheets，編輯儲存後由 Apps Script 自動將資料推送並覆蓋 `data/` 資料夾內對應的 CSV 檔案，無需手動上傳。

---

## 專案結構

```
examtimer_test/
├── app.js          # Express 後端，處理 CSV 讀取
├── index.html      # 前端頁面
├── run.js          # 前端邏輯
├── data/           # 各班級課表 CSV（由 Google Sheets 自動同步）
│   ├── j1.csv          # 國一
│   ├── j2.csv          # 國二
│   ├── j3.csv          # 國三
│   ├── s1_science.csv  # 高一（自然組）
│   ├── s1_social.csv   # 高一（社會組）
│   ├── s2_science.csv  # 高二（自然組）
│   ├── s2_social.csv   # 高二（社會組）
│   ├── s3_science.csv  # 高三（自然組）
│   └── s3_social.csv   # 高三（社會組）
├── css/
│   └── bootstrap.min.css
├── js/
│   ├── bootstrap.min.js
│   └── jquery-3.7.1.min.js
└── package.json
```

---

## 安裝與啟動

**需求：** Node.js

```bash
# 安裝相依套件
npm install

# 啟動伺服器
npm start
```

啟動後開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)

---

## CSV 格式

`data/` 內的 CSV 由 Google Sheets 自動產生，格式如下：

```
起始時間,結束時間,科目,換班與否（原班才需填）
08:00,09:00,數學,
09:15,10:35,國文,
13:00,13:50,作文,原
```

| 欄位 | 說明 |
|------|------|
| 起始時間 | 格式 `HH:MM` |
| 結束時間 | 格式 `HH:MM` |
| 科目 | 科目名稱 |
| 換班與否 | 需回原班上課填 `原`，否則留空 |

> 第四欄填入 `原` 後，畫面上該科目會顯示為 `科目(原)`，提示考生回原班應試。

---

## 使用方式

### 從課表載入

1. 在「年級」選單選擇國中或高中
2. 在「班級 1」選擇主要班級
3. （選填）在「班級 2」選擇第二個班級，兩班科目會合併顯示
4. 課表自動載入並開始倒數

![](/img/select_class.png)

### 手動輸入科目

1. 點擊「add subject」按鈕（會自動清除已載入的資料並重置班級選單）
2. 填入科目、時間，若需標示回原班請勾選「Yes」
3. 點擊「Save」新增

![](/img/input_subject.png)

### 編輯／刪除科目

點擊畫面上已顯示的科目，即可開啟編輯視窗進行修改或刪除。

![](/img/edit_ifm.png)

### 座位表

在「Upload Seat」上傳圖片，可在頁面右側顯示座位表。點擊「Delete」可刪除。

![](/img/upload_seat.png)

### 全螢幕

點擊「FS」按鈕切換全螢幕模式。

![](/img/fs.png)

---

## 相依套件

| 套件 | 用途 |
|------|------|
| express | Web 伺服器 |
| body-parser | 解析 JSON 請求 |
| cors | 跨來源資源共用 |
| csvtojson | 解析 CSV 檔案 |
| node-fetch | 從 GitHub 取得 CSV |
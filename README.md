# AI 影片製作流程與粗剪原型

> **目前工作入口：[從這裡開始](START_HERE.md)。**
>
> 流程／技能 0.3.0（2026-10-04），狀態 testing。本次目的：加入 [XML 素材自檢與必要轉檔](docs/production/XML_HANDOFF_RULES.md)，沿用包裝自檢，將本批正式作品 XML 成功回報記入 [驗收紀錄](docs/production/pilots/PILOT_001_XML.md)，並提供 [跨平台技能包](docs/production/DISTRIBUTION.md)。完成標準：技能與工作表可指導預檢、必要轉檔及實際來源更新；打包內容完整且可驗證。第二批與學生重現仍待完成。
>
> 已採用方向：ChatCut Desktop 處理通用剪輯，依作品交給 DaVinci 精修，保留自建專案並以兩批實測決定開發缺口。
>
> **驗證邊界：**main 的現有程式是示範／XML 原型，真實處理入口尚未接完；另有尚未合併的 [PR #2](https://github.com/DinoHappyKM/tool-video-roughcut/pull/2)，包含專案輸出、驗證與 Resolve 原生多機工作，不能只按 main 判斷全部進度。其實機驗收紀錄待釐清，見 [目前狀態](docs/production/STATUS.md)。
>
> 下方為既有原型的設計與使用說明，描述目標，不等於本次已完成真實影片、跨平台連結或 DaVinci 匯入驗證。主流程請以新入口為準。不要為此任務格式化既有硬碟。
>
> **執行提醒：**既有 `npm run demo` 會寫入設定指定的 B-roll metadata；只在隔離副本／測試目錄執行，不能拿正式素材索引驗證。本次未執行 demo，也未改動原程式。

---

# AI 影片初剪助理 (DaVinci Resolve XML Workflow)

> 專為 **DinoHappyKM** 團隊打造的行銷影音自動化剪輯助理。  
> 透過 AI 語音辨識（A-roll 逐字稿時間戳）與 B-roll 空景情境智能標註，自動產生可在 **DaVinci Resolve** 一鍵匯入的初剪時間線 XML。

---

## 🎯 核心設計哲學

- **AI 不生出死板成片**：AI 擔任**專業剪輯助理**，不負責直接渲染出片，而是梳理結構。
- **排好時間線，交給人類微調**：
  - **軌道 V1 (Video 1 + Audio 1)**：A-roll 說話主片（保留完整時間軸與說話節奏）。
  - **軌道 V2 (Video 2)**：AI 依據口播逐字稿語意，在關鍵秒數精準疊加情境 B-roll（例如提到「數據轉換」自動切入「轉換率圖表」）。
- **匯入達芬奇即用（Zero-Copy）**：輸出標準 FCP 7 XML 格式，達芬奇直接引用外接硬碟原檔，秒開不佔本機磁碟。

---

## 💾 影音儲存架構：代碼與素材分離 (Code & Media Decoupling)

龐大的 4K/1080p 影片素材（數十 GB ~ 數 TB）**不儲存在 GitHub**，而是存放於外接 SSD / 硬碟 / 團隊 NAS 中：

```
┌─────────────────────────────────────────────────────────┐
│ 📁 GitHub 儲存庫 (< 10MB)                               │
│  - 核心程式碼與比對演算法 (Node.js)                      │
│  - assets/broll_metadata.json (情境標籤與相對路徑索引)   │
│  - .env.example / 設定檔範本                            │
│  - .gitignore (全面阻擋任何影片大檔入庫)                 │
└────────────────────────────┬────────────────────────────┘
                             │ 動態讀取與路徑組裝
┌────────────────────────────▼────────────────────────────┐
│ 💾 外接 SSD / 硬碟 (龐大素材池)                          │
│  - a_roll/ (本次錄製之口播原始檔)                       │
│  - b_roll/ (常備空景、數據圖表、情境畫面)               │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 🎬 DaVinci Resolve 匯入 XML ➔ 瞬間點亮雙軌時間線         │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 跨平台協作指南 (Windows & macOS)

### 1. 外接 SSD 格式規範
- 團隊共用之外接硬碟 / SSD 請統一格式化為 **`exFAT`** 格式。
- **好處**：Windows 與 macOS 均能原生直接讀寫，且支援單檔大於 4GB 的高畫質影片。

### 2. 本機環境設定 (`.env`)
複製 `.env.example` 為 `.env`，並填入您電腦上的外接 SSD 掛載路徑：

- **Windows 使用者範例**：
  ```ini
  MEDIA_ROOT=E:/DinoHappyKM_Media
  A_ROLL_DIR=E:/DinoHappyKM_Media/a_roll
  B_ROLL_DIR=E:/DinoHappyKM_Media/b_roll
  OUTPUT_DIR=./output
  ```

- **macOS 使用者範例**：
  ```ini
  MEDIA_ROOT=/Volumes/Extreme_SSD/DinoHappyKM_Media
  A_ROLL_DIR=/Volumes/Extreme_SSD/DinoHappyKM_Media/a_roll
  B_ROLL_DIR=/Volumes/Extreme_SSD/DinoHappyKM_Media/b_roll
  OUTPUT_DIR=./output
  ```

> 💡 若未設置 `.env`，系統預設將使用本專案內的 `assets/` 目錄做為本機預設。

### 3. DaVinci Resolve 跨電腦「一秒重新連結素材 (Relink)」
若使用其他電腦生成的 XML 檔案匯入達芬奇時出現「Media Offline（媒體離線）」：
1. 在達芬奇左上角 **Media Pool (媒體池)** 中全選素材。
2. 點擊右鍵 ➔ 選擇 **`Relink Selected Clips... (重新連結所選片段)`**。
3. 選擇您目前電腦掛載的 SSD 資料夾，達芬奇將依據檔案名稱**瞬間全數點亮重連**！

---

## 📂 專案目錄結構

```
tool-video-roughcut/
├── assets/
│   ├── a_roll/                 # (本機/SSD) A-roll 口播影片放置處
│   ├── b_roll/                 # (本機/SSD) B-roll 情境素材池
│   └── broll_metadata.json     # 跨平台 B-roll 情境標籤索引 (Commit 至 Git)
├── src/
│   ├── core/
│   │   ├── config.js            # 環境變數與 SSD 路徑解析器
│   │   ├── davinciXmlBuilder.js # DaVinci FCP 7 XML 生成器 (跨平台 URI)
│   │   ├── brollAnalyzer.js     # B-roll 情境標籤與動態路徑檢索
│   │   └── semanticMatcher.js   # 語意比對與剪輯節奏控制器
│   ├── demo.js                  # 完整情境示範與 XML 生成驗證
│   └── index.js                 # 核心執行入口
├── examples/
│   └── sample_davinci_roughcut.xml # 可直接拖入達芬奇測試的示範時間線
├── output/                      # 產出的 DaVinci XML 檔 (被 .gitignore 忽略)
├── .env.example                 # 本機環境變數配置範本
├── .gitignore                   # 大檔與環境忽略規則
├── package.json
└── README.md
```

---

## 🚀 快速上手 (Quick Start)

### 1. 執行示範產生器
```bash
npm run demo
```
將會在 `output/davinci_roughcut_demo.xml` 產生一份完整的初剪時間線檔案。

### 2. 在 DaVinci Resolve 中匯入時間線
1. 打開 **DaVinci Resolve**。
2. 點選頂部選單：**`File (檔案)` ➔ `Import (匯入)` ➔ `Timeline... (時間線)`**（快捷鍵 `Ctrl + Shift + I` 或 `Cmd + Shift + I`）。
3. 選擇產生的 `.xml` 檔案。
4. 點選確定，時間線會自動建立雙軌道（V1 口播 + V2 情境 B-roll 覆蓋）！

---

## 👥 DinoHappyKM 團隊標準協作流程

1. **拍攝與整理**：將錄製之 A-roll 與蒐集之 B-roll 放入外接 SSD。
2. **AI 情境分析**：執行掃描或多模態標記，更新 `assets/broll_metadata.json` 並 Commit 到 GitHub（全團隊共享標籤庫）。
3. **產出初剪**：依據逐字稿時間戳執行 `npm run build:xml`，取得專案 XML。
4. **精修與出片**：剪輯師插上 SSD，匯入 XML 即可在達芬奇中完成調色、音效與細部微調。


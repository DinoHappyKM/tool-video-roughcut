# AI 訪談影片粗剪決策引擎 (DaVinci Resolve Workflow)

> 用 AI 處理訪談逐字稿、Topic Mining、剪輯提案與原始時碼 mapping，由人選擇故事後，生成可在 **DaVinci Resolve 19–21** 匯入的 A-roll 粗剪，以及 Resolve 原生的 A/B 多機素材。
>
> Phase 0 已完成真實繁中素材的 A-roll XML round-trip；A/B 雙機改採 Resolve 原生 Multicam Clip，B-roll、字卡、音樂仍延後。

## Phase 0 專案輸出

`timeline.json` 是唯一剪輯 SSOT。匯出前會先檢查媒體是否存在、剪點是否有效、軌道是否重疊，並把 VFR 與人工復核項目列為 warning。

```bash
npm test
npm run build:project -- "/absolute/path/to/PROJECT_001"
```

成功後會在該專案的 `export/<output_id>/` 產生：

- DaVinci FCP 7 XML
- SRT
- `validation_report.json`
- `edit_report.md`
- 若 Project 同時有 `CAM_A` 與 `CAM_B`，另會產生 `multicam_manifest.json`。這不是 XML 的 V2 視訊軌，而是供 Resolve Script 建立原生 Multicam Clip 的契約。

### A/B 多機位：必須使用 Resolve 原生 Multicam Clip

FCP 7 XML 能描述一般影像軌道，**不能可靠地建立 DaVinci Resolve 的可切換 Multicam Clip**。因此系統刻意禁止把 `alternate_camera` 輸出成 V2 疊畫面。

1. 先在 Media Pool 匯入 A、B 原始檔。
2. 由 `export/<output_id>/multicam_manifest.json` 產生 `Aperture` 原生 Multicam Clip：A 為 Angle 1／唯一節目主音訊，B 為 Angle 2，採 Sound Sync。
3. 同一支腳本會把已核准的 A-roll 剪點套用到原生 Multicam Clip，建立可切換鏡位的 `Aperture_<topic>_<duration>` 粗剪時間線，並另存 `.drt`。
4. 在時間線內核對嘴型後，再由剪輯師或後續 AI 切換角度；所有切換仍是 Resolve 多機剪輯，隨時可改回 A 或 B。

執行腳本前，將 `scripts/resolve/create_aperture_multicam.py` 安裝到 Resolve 的 `Fusion/Scripts/Utility` 目錄，並將環境變數 `ROUGH_CUT_MULTICAM_MANIFEST` 指向上述 manifest。腳本會建立 Resolve project database 內的 Multicam Clip 與粗剪 Timeline，並輸出可再次匯入 Resolve 的 `.drt`；不會改動來源檔。

---

## 🎯 核心設計哲學

- **AI 不生出死板成片**：AI 擔任**專業剪輯助理**，不負責直接渲染出片，而是梳理結構。
- **排好時間線，交給人類微調**：
  - **A-roll XML (V1 + A1)**：已核准的說話主片與主音訊。
  - **Aperture 原生 Multicam Clip**：Angle 1 是 A 機與主音訊；Angle 2 是 B 機。切鏡不是疊軌，能隨時在 Resolve 多機檢視中改選。
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
│ 🎬 DaVinci Resolve 匯入 XML + 建立原生 Multicam Clip      │
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
4. 點選確定，時間線會建立 V1 A 機主畫面／A1 主音訊。若有雙機，請依本文件的原生 Multicam 流程建立 `Aperture`，不要把 B 機疊在 V2。

---

## 👥 DinoHappyKM 團隊標準協作流程

1. **拍攝與整理**：將錄製之 A-roll 與蒐集之 B-roll 放入外接 SSD。
2. **AI 情境分析**：執行掃描或多模態標記，更新 `assets/broll_metadata.json` 並 Commit 到 GitHub（全團隊共享標籤庫）。
3. **產出初剪**：依據逐字稿時間戳執行 `npm run build:xml`，取得專案 XML。
4. **精修與出片**：剪輯師插上 SSD，匯入 XML 即可在達芬奇中完成調色、音效與細部微調。

# AI 影片初剪助理 (DaVinci Resolve XML Workflow)

> 專為 **DinoHappyKM** 團隊打造的行銷影音自動化剪輯助理。  
> 透過 AI 語音辨識（A-roll 逐字稿時間戳）與 B-roll 空景情境智能標註，自動產生可在 **DaVinci Resolve** 一鍵匯入的初剪時間線 XML。

---

## 🎯 核心設計哲學

- **AI 不生出死板成片**：AI 不負責直接算圖輸出影片，而是擔任**專業剪輯助理**。
- **排好時間線，交給人類微調**：
  - **軌道 V1 (Video 1 + Audio 1)**：A-roll 說話主片（保留完整時間軸與語音）。
  - **軌道 V2 (Video 2)**：AI 依據講話內容自動在對應秒數疊加合適的情境 B-roll（例如提到「數據轉換」就切入「轉換率報表圖表」）。
- **匯入達芬奇即用**：輸出標準 FCP 7 XML 格式，剪輯師在 DaVinci Resolve 中點選匯入時間線，立即可做調色、精修與音效後製。

---

## 📂 專案目錄結構

```
tool-video-roughcut/
├── assets/
│   ├── a_roll/                 # 存放錄製好的 A-roll 原始口播影片 (.mp4/.mov)
│   ├── b_roll/                 # B-roll 素材沙盒池 (.mp4/.mov)
│   └── broll_metadata.json     # B-roll 畫面情境標籤快取索引 (避免重複運算)
├── src/
│   ├── core/
│   │   ├── davinciXmlBuilder.js # DaVinci Resolve XML 生成器 (相容 24/30/60fps)
│   │   ├── brollAnalyzer.js     # B-roll 沙盒情境標籤與檢索器
│   │   └── semanticMatcher.js   # 語意比對與剪輯節奏控制器
│   ├── demo.js                  # 完整情境示範與 XML 生成驗證
│   └── index.js                 # 核心執行入口
├── output/                      # 產出的 DaVinci XML 檔
├── examples/
│   └── sample_davinci_roughcut.xml # 可直接拖入達芬奇測試的示範時間線
├── package.json
└── README.md
```

---

## 🚀 快速上手 (Quick Start)

### 1. 執行示範產生器
無需配置任何複雜環境，直接執行：

```bash
npm run demo
```

將會在 `output/davinci_roughcut_demo.xml` 產生一份完整的初剪時間線檔案。

### 2. 在 DaVinci Resolve 中匯入時間線
1. 打開 **DaVinci Resolve**。
2. 點選頂部選單：**`File (檔案)` ➔ `Import (匯入)` ➔ `Timeline... (時間線)`**（快捷鍵 `Ctrl + Shift + I` 或 `Cmd + Shift + I`）。
3. 選擇剛剛產生的 `.xml` 檔案。
4. 點選確定，時間線會自動建立雙軌道（V1 口播 + V2 情境 B-roll 覆蓋）！

---

## 👥 協作指南 (DinoHappyKM 團隊)

1. **上傳 B-roll 沙盒素材**：將常備的情境畫面放入 `assets/b_roll`。
2. **AI 情境分析與標記**：系統自動或透過多模態 AI 對畫面抽幀打標籤，記錄在 `assets/broll_metadata.json`。
3. **錄製完 A-roll**：放進 `assets/a_roll`，執行初剪工具，一鍵獲取 XML 檔直接進入達芬奇精修。

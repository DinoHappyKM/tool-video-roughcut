# Repository Rules

- 原始影片、音訊、圖片與音樂一律唯讀；所有 proxy、cache 與 export 寫入獨立目錄。
- Actual Transcript 是內容證據；不得用訪談稿或 AI 補出原素材沒有說過的句子。
- 流程順序固定為 Topic Mining → Human Topic Selection → Edit Variant → Human Approval → cuts → timeline。
- `timeline.json` 是剪輯結果的唯一 canonical authority；XML、SRT 與 report 都是可重建輸出。
- AI 決策保留來源、理由、信心值、規則／prompt 版本及 human override。
- 低信心、VFR、缺檔、無效剪點或語意不連續必須顯示 warning／error，不得靜默通過。
- Phase 0／1 先驗證單機 A-roll 可實際匯入 DaVinci Resolve Studio 19；B-roll、字卡、音樂與自動切鏡不得提前成為必要依賴。
- 第三方元件與模型必須鎖定版本並記錄授權；未經 Owner 核准不得把 GPL／AGPL 程式併入產品核心。

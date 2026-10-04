# AI 影片製作：從這裡開始

流程／技能版本：0.3.1｜更新：2026-10-04｜狀態：testing

目的：用「自己的剪輯規範＋Codex／ChatCut Desktop＋必要時 DaVinci」處理單機、多機、一部或多部成片；以真實素材驗證後，再決定自建功能。
完成標準：四張工作表可直接填寫，兩批試跑有可追溯紀錄，品質與工時分開驗收。文件完成不代表軟體、成片或教學環境已通過。

## 現在開始

1. 閱讀 [目前狀態](docs/production/STATUS.md)，確認工具與素材是否就緒。
2. 依 [連接與交接](docs/production/SETUP_AND_HANDOFF.md) 檢查 ChatCut Desktop。
3. 依 [第一批試跑](docs/production/pilots/PILOT_001.md) 建立本機工作紀錄。
4. 先完成 [素材盤點](docs/production/templates/01_ASSET_INVENTORY.md)，再和使用者討論作品方向。
5. 依 [製作流程](docs/production/WORKFLOW.md) 完成初稿與交付；用 [試跑規範](docs/production/PILOT_PROTOCOL.md) 記錄實際結果。

首輪已用真實 A/B 訪談素材完成同步母版、兩部獨立作品及輸出抽查；相容 B-roll 換入正式短長版後，使用者已回報 XML／DaVinci 最後測試成功。該回報不代替每項效果、完整品質、第二批或學生環境驗收。見 [交接結果](docs/production/pilots/PILOT_001_XML.md)。

0.3.1 補上逐版本字幕核對：本次兩份較早包裝 v1 的偏左字幕已補正，新版 v2 通過不能代表舊包裝稿；預覽、實際輸出與完整播放分開記錄。

接續審片前先讀 [包裝與修改規則](docs/production/PACKAGING_RULES.md) 和 [首輪回饋](docs/production/pilots/PILOT_001_LESSONS.md)。需要 XML 時主動執行 [素材自檢與必要轉檔](docs/production/XML_HANDOFF_RULES.md)：檢查媒體與引用，建立必要副本並真正更新時間線，字幕／聲音另訂交接方案。[打包與安裝](docs/production/DISTRIBUTION.md)。

[Codex 技能入口](.agents/skills/video-production-pilot/SKILL.md)，引用本儲存庫的規則主檔；已更新來源不表示 ChatCut 技能庫已安裝或學生已重現。

## 四張共同工作表

| 表單 | 用途 |
|---|---|
| [素材盤點表＋內容地圖](docs/production/templates/01_ASSET_INVENTORY.md) | 素材身分、機位／場次／take、內容、同步證據 |
| [作品需求卡](docs/production/templates/02_OUTPUT_BRIEF.md) | 每部作品的觀眾、主題、必留內容、時長、方向 |
| [剪輯決策表](docs/production/templates/03_EDIT_DECISIONS.md) | 原始片段、同步位置、成片位置、理由與人工修改 |
| [交付檢查表](docs/production/templates/04_DELIVERY_CHECKLIST.md) | 內容、聲畫、字幕、成片與 DaVinci 交接 |

另有 [工時、費用與試跑報告](docs/production/templates/05_RUN_REPORT.md)、[案例驗收](docs/production/TEST_CASES.md)、[影片類型規則](docs/production/SCENARIOS.md) 與 [教學交付規範](docs/production/TEACHING.md)。

## 如何保存

- 本儲存庫的 `docs/production` 是通用流程與空白表單的維護來源。
- 填寫後的紀錄存放於本機 `production-work/<批次>/`，已加入忽略規則；原始媒體預設維持在使用者指定位置；明確要求搬移或清理時，依 XML 交接規則檢查全部引用、保留來源對照後執行。
- 每部作品有固定作品 ID、獨立時間線與版本；保留原始素材、完整同步母版與來源對照。
- 若由 PR #2 的自建引擎輸出，沿用該引擎的 `timeline.json` 作為唯一機器可執行剪輯主檔。表單是決策與驗收證據，不能變成另一份可獨立驅動輸出的時間線。
- ChatCut 工程與自建 `timeline.json` 尚無自動雙向同步。作品需求卡須指定當前編輯主檔；換工具時保存版本，明確交接主導權。
- 不將原始影片、完整私人逐字稿或帳號資料加入 GitHub；通用範例全部使用合成資料。

## 開發範圍

本次維護流程、表單、試跑紀錄與薄技能入口，保留既有程式。至少兩批素材出現同一缺口且現成方法無法解決，再評估投入輔助工具。[變更紀錄](docs/production/CHANGELOG.md)

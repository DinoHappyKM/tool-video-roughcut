---
name: video-production-pilot
description: 接續本儲存庫的 Codex／ChatCut／DaVinci 影片試跑、審片修改或回饋整理時使用；讀取最新工程並保留人工修改，依素材與作品需求完成剪輯，套用已確認的繁體字幕、B-roll、片頭片尾及聲音驗收規則。
---

# AI 影片製作試跑

這是儲存庫內的技能入口，通用規則唯一來源在 docs/production。使用時須保留整個儲存庫的相對路徑；不要只複製此技能資料夾當成完整學生安裝包。

## 先讀與確認

閱讀 [工作入口](../../../START_HERE.md) 與 [狀態](../../../docs/production/STATUS.md)。接續剪輯時依 [製作流程](../../../docs/production/WORKFLOW.md) 讀目前工程與目標時間線；不能以舊輸出代替目前人工修改。ChatCut 連線以實際 get_active_project／read_project 驗證；連線未成功則處理 [連接與交接](../../../docs/production/SETUP_AND_HANDOFF.md)，不假稱已接手。

## 依本次任務工作

- 新素材或新版本：盤點素材與內容地圖，沿用已確認方向，為每部作品建立需求卡；同場多機保留完整同步母版，成片使用獨立時間線。套用 [影片類型規則](../../../docs/production/SCENARIOS.md)；普通疊軌不宣稱原生 Multicam。
- 字幕、補充畫面、封面、聲音或審片修改：先讀 [包裝與修改規則](../../../docs/production/PACKAGING_RULES.md)，再限定本次修改範圍。該文件記錄本專案已確認的預設；作品另有明確指示時更新需求卡。
- 只整理測試回饋：不改時間線或素材。參考 [首輪回饋](../../../docs/production/pilots/PILOT_001_LESSONS.md)，將新回饋轉成適用規則、證據狀態及 [回歸案例](../../../docs/production/TEST_CASES.md)，同步相關工作表；不因一次缺口直接開發新引擎。

## 驗收與記錄

主動執行 [包裝規則的交付前自我檢查](../../../docs/production/PACKAGING_RULES.md)：字幕單行置中、人聲降噪與副作用、繁中字形及適合影片的字型都是必檢項目；不通過先在已授權範圍修正並重驗，記錄證據或明確待審原因，不等使用者再次提醒。

用 [交付檢查表](../../../docs/production/templates/04_DELIVERY_CHECKLIST.md) 核對實際輸出與既有人工修改。明確區分設定核對、畫面抽查、完整播放、使用者驗收及學生重現；未執行保留待測。保持原始媒體、來源追蹤與其他作品完整。私人素材、逐字稿、人物資訊及工具暫時 ID 保存在本機，不寫入通用技能。

本技能不提供隱含的 GitHub 發布、安裝或時間線修改授權，執行範圍依目前使用者請求決定。

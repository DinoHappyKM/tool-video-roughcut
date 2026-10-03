# ChatCut Desktop 連接與 DaVinci 交接

更新：2026-10-03｜[目前狀態](STATUS.md)｜[入口](../../START_HERE.md)

## Windows 連接檢查

1. 確認 Windows x64；檢查既有 ChatCut 安裝，避免重複。
2. 使用 [官方 Windows 下載](https://api.chatcut.io/desktop/download/windows)。保留下載來源、檔案路徑與 Authenticode 結果；遇無效或未知發布者警告不得繞過。
3. 在桌面完成安裝並開啟 ChatCut；使用者本人登入，不傳遞密碼。
4. 讓官方桌面程式建立本機連接，不手動猜寫 MCP 設定。
5. 如目前對話尚未載入工具，桌面連接完成後開新對話，指定本工作流程入口。
6. 真正測試讀取目前工程、識別工程名稱與素材清單。工具存在不等於已讀到正確工程。
7. 在測試工程做一項可逆小變更並回讀，再播放確認。通過後才登記本機連接已驗證。

安裝檔已下載、程式已開啟、帳號登入、工具載入、工程回讀、可見編輯分別登記，不能相互代替。
桌面版可以使用本機媒體，但登入、同步及部分 AI 功能仍需要網路。付費與點數依帳號當下顯示，未查明前保持待確認。

## 交接前先選擇

每部作品在需求卡指定：
- 在 ChatCut 完成，或在 DaVinci 完成。
- 字幕、動畫、聲音與調色各由哪端完成。
- 是否要求 Resolve 原生可切換的 Multicam Clip。

ChatCut 普通多軌、已切好的平面時間線、Resolve 原生 Multicam Clip 是不同交付，不得混稱。
XML 交接若保留不到原生多機功能，先記錄限制，再選使用平面剪輯或既有自建 Resolve 路線；不宣稱會自動轉換。

## DaVinci 交接包

保存 XML、原始媒體可連結位置、已渲染動畫、獨立字幕、參考成片與缺失清單。字幕／文字／特效／轉場可能不能完整經 XML 攜帶；部分透明動畫輸出需要付費能力。
開啟 DaVinci 實際匯入，檢查：
- 素材連結、幀率、解析度、聲道、開始與結束位置。
- 各剪點附近、長錄影前中後段及重啟處聲畫同步。
- 字幕、構圖、效果、音樂及音效是否符合參考成片。
- 需要重做什麼、花多少時間、是否經使用者接受。
- 另存可重新開啟的工程／時間線，確定之後由哪個工程繼續編輯。

## 官方依據

以下為文件支援，仍需依目前軟體版本實測：
- [桌面版](https://chatcut.io/docs/desktop-app)
- [官方桌面連接指引](https://github.com/ChatCut-Inc/agent-plugin/blob/main/chatcut-desktop-codex-plugin/skills/connect-chatcut-desktop/SKILL.md)
- [時間線與多機同步](https://chatcut.io/docs/timeline)
- [多機 Agent 流程](https://github.com/ChatCut-Inc/agent-plugin/blob/main/codex/skills/multicam-sync/SKILL.md)
- [內容重組與多版本](https://github.com/ChatCut-Inc/agent-plugin/blob/main/codex/skills/talking-head-guide/references/other-a-roll-editing-scenarios.md)
- [XML 匯出](https://chatcut.io/docs/export-xml)

不要照抄舊版本工具名稱或參數當成現行介面；連接後讀取實際工具契約。

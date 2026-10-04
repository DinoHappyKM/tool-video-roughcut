# 技能打包與安裝

版本：0.3.1｜[入口](../../START_HERE.md)

## 取得套件

[下載跨平台技能 ZIP](../../dist/video-production-pilot-v0.3.1.zip)｜[校驗值](../../dist/SHA256SUMS.txt)

GitHub 目前為私人儲存庫；有權限者可從上述 ZIP 頁面下載原始檔，學生可取得老師分發的同一份 ZIP，不要求先開放私人專案。

## 套件內容與唯一來源

儲存庫 .agents/skills/video-production-pilot 是流程入口，通用規則以 docs/production 維護。ZIP 由 [打包工具](../../tools/package_workflow_skill.py) 產生自包含部署副本：payload/video-production-pilot/SKILL.md 及 references/ 內的入口、規則與工作表。不要只拷貝儲存庫薄入口後遺漏其外部引用。

改規則回到本儲存庫，再重新打包；不另外維護 Windows／macOS 兩份技能。來源與部署副本的對照、SHA256 及驗證方法在套件內。包內沒有私人影片、BGM、訪談逐字稿、工程 ID 或帳號資料。

## Windows／macOS 操作

先解壓縮再看最外層「安裝說明.md」。兩種方式使用同一個 payload：
- Windows：以 Install-Windows.ps1 安裝到指定專案 .agents/skills。
- macOS：用 bash ./Install-Mac.sh 安裝到指定專案 .agents/skills，腳本不依賴 ZIP 保存 executable bit。
- 預設專案是解壓縮資料夾；可指定另一個專案。相同內容重跑不多一層，不同內容停止並保留已有資料。
- 之後在可支援專案 Skills 的 Codex 打開該專案。安裝檔案檢查、原生發現及 ChatCut 技能庫是不同驗證；本次沒有安裝 ChatCut My Skills 或承諾所有 Agent 都能直接上傳此完整安裝包。

完整流程操作仍需要 ChatCut Desktop／可用 Agent 的實際連線；有 XML 需求才依交接規則檢查／必要轉檔，再到 DaVinci 驗收。安裝包不包含編輯器或素材。

## 重建與驗證

在儲存庫根目錄用 Python 3.9 或更新版本執行：

python tools/package_workflow_skill.py

輸出 dist/ 下 ZIP 與 SHA256SUMS.txt。打包工具檢查部署副本所有本機 Markdown 引用、封包階層、來源檔對照與不含私人工作區；另外使用 Skill Creator 與跨平台 ZIP 驗證器確認格式／解壓縮。本機安裝及 Windows 與 macOS 的真實環境結果分開記錄。

## 本版驗證紀錄

[發行驗證結果](../../dist/VALIDATION.json)：來源與部署 Skill 格式、ZIP 階層、23 個來源檔對照、全部部署引用已通過。Windows PowerShell 5.1 在含中文及空格的路徑完成安裝，23 個檔案與 payload 完全一致；重複安裝及遇到不同既有內容時停止且不修改檔案均通過。

macOS 腳本已確認 LF 換行及可由 bash 啟動的封裝方式，但未在 macOS 執行。原生技能發現／選取、ChatCut My Skills、第二批素材、學生帳號與課堂重現仍待測；本版屬試跑發行。

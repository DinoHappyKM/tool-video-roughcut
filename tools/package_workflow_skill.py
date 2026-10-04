"""Build portable workflow deployment from canonical sources."""
from pathlib import Path
import hashlib,json,posixpath,re,zipfile,tempfile
from urllib.parse import unquote,quote
ROOT=Path(__file__).resolve().parents[1]
VERSION="0.3.0";SLUG="video-production-pilot";ROOTNAME=f"{SLUG}-v{VERSION}"
SKILL=ROOT/".agents"/"skills"/SLUG/"SKILL.md"
LINK=re.compile(r"(!?\[[^\]]*\]\()([^)\n]+)(\))")
REPO="https://github.com/DinoHappyKM/tool-video-roughcut/blob/codex/production-workflow-pilot/"
WINDOWS=r'''param([string]$ProjectDirectory = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
function Read-FileSha256([string]$FilePath) {
    $stream = [IO.File]::OpenRead($FilePath)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)) }
    finally { $stream.Dispose(); $algorithm.Dispose() }
}
$source = Join-Path $PSScriptRoot 'payload\video-production-pilot'
$project = [IO.Path]::GetFullPath($ProjectDirectory)
$target = Join-Path $project '.agents\skills\video-production-pilot'
if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) { throw '找不到完整 payload，請先解壓縮。' }
$files = @(Get-ChildItem -LiteralPath $source -File -Recurse)
foreach ($file in $files) {
    $relative = $file.FullName.Substring($source.Length).TrimStart('\','/')
    $dest = Join-Path $target $relative
    if (Test-Path -LiteralPath $dest) {
        if (-not (Test-Path -LiteralPath $dest -PathType Leaf)) { throw "目的地不是檔案：$dest" }
        if ((Read-FileSha256 $dest) -ne (Read-FileSha256 $file.FullName)) { throw "已有不同內容，保留原檔；請先備份或指定另一個專案：$dest" }
    }
}
foreach ($file in $files) {
    $relative = $file.FullName.Substring($source.Length).TrimStart('\','/')
    $dest = Join-Path $target $relative
    if (-not (Test-Path -LiteralPath $dest)) {
        [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null
        Copy-Item -LiteralPath $file.FullName -Destination $dest
    }
    if ((Read-FileSha256 $dest) -ne (Read-FileSha256 $file.FullName)) { throw "安裝驗證失敗：$dest" }
}
Write-Output "已安裝影片技能檔案：$target"
Write-Output '在 Codex 打開此專案，請使用 $video-production-pilot；原生發現與 ChatCut 連線仍須實測。'
'''
MAC=r'''#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "§{BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/payload/video-production-pilot"
PROJECT_DIR="§{1:-$SCRIPT_DIR}"
TARGET_DIR="$PROJECT_DIR/.agents/skills/video-production-pilot"
if [[ ! -f "$SOURCE_DIR/SKILL.md" ]]; then
  echo "找不到完整 payload，請先解壓縮。" >&2
  exit 1
fi
while IFS= read -r -d '' file; do
  relative="§{file#"$SOURCE_DIR"/}"
  dest="$TARGET_DIR/$relative"
  if [[ -e "$dest" ]]; then
    if [[ ! -f "$dest" ]] || ! cmp -s "$file" "$dest"; then
      echo "已有不同內容，保留原檔；請先備份或指定另一個專案：$dest" >&2
      exit 1
    fi
  fi
done < <(find "$SOURCE_DIR" -type f -print0)
while IFS= read -r -d '' file; do
  relative="§{file#"$SOURCE_DIR"/}"
  dest="$TARGET_DIR/$relative"
  mkdir -p -- "$(dirname -- "$dest")"
  if [[ ! -e "$dest" ]]; then cp -- "$file" "$dest"; fi
  cmp -s "$file" "$dest" || { echo "安裝驗證失敗：$dest" >&2; exit 1; }
done < <(find "$SOURCE_DIR" -type f -print0)
printf '已安裝影片技能檔案：%s\n' "$TARGET_DIR"
echo '在 Codex 打開此專案，請使用 $video-production-pilot；原生發現與 ChatCut 連線仍須實測。'
'''.replace('§','$')
INSTALL="""# AI 影片製作試跑技能｜安裝說明

版本：0.3.0。先解壓縮整包，再執行對應平台安裝。包內沒有影片或編輯器，ChatCut Desktop 連線與素材另行準備。

## Windows

在解壓縮資料夾開啟 PowerShell，執行：

powershell.exe -NoProfile -File .\\Install-Windows.ps1

預設裝到本資料夾的 .agents/skills。要裝進其他專案，加上 -ProjectDirectory "你的專案完整路徑"。若政策阻擋腳本，可在確認為可信任老師套件後，以 powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\\Install-Windows.ps1 執行；只影響本次程序，不更改永久政策。

## macOS

在解壓縮資料夾開啟終端機，執行：

bash ./Install-Mac.sh

預設裝到本資料夾的 .agents/skills。要裝進其他專案，執行 bash ./Install-Mac.sh "/你的專案完整路徑"。不需要雙擊或預先設定 executable bit。

## 開始使用

在 Codex 打開已安裝的專案，輸入「請使用 $video-production-pilot 接續影片製作；這次要／不要交接 XML」。先確認實際讀到正確 ChatCut 工程，再開始任務。

相同內容可重複安裝；已有不同內容會停止且保留原檔，請先備份或選另一個專案。安裝器不刪除舊資料；未完成安裝先讀錯誤原因。

Skill 本體在 payload/video-production-pilot，參考資料已包含。其他 Agent 若支援原生技能匯入，使用這個完整子資料夾；整包是專案安裝包，不宣稱所有產品都可直接上傳。

格式與打包、Windows 安裝檔案測試、Codex 原生發現、ChatCut My Skills 安裝、macOS 和學生帳號是不同驗證。macOS 與學生環境未實測，第二批素材與工時對照仍待完成。

規則修改回到 GitHub 的 docs/production，不直接改部署副本。
官方專案技能位置：[Build skills](https://learn.chatgpt.com/docs/build-skills)（查核 2026-10-04）。
"""
def sha(data):return hashlib.sha256(data).hexdigest()
def build():
    mapping={SKILL:"SKILL.md",ROOT/"START_HERE.md":"references/START_HERE.md"}
    mapping.update({p:"references/"+p.relative_to(ROOT).as_posix() for p in sorted((ROOT/"docs"/"production").rglob("*.md"))})
    files={};manifest=[]
    for source,dest in mapping.items():
        raw=source.read_bytes();text=raw.decode("utf-8")
        def change(m):
            target=m.group(2);url=target[1:-1] if target.startswith("<") and target.endswith(">") else target
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:",url) or url.startswith("#"):return m.group(0)
            path,sep,anchor=url.partition("#")
            absolute=(source.parent/unquote(path)).resolve()
            if absolute in mapping:
                rewritten=posixpath.relpath(mapping[absolute],posixpath.dirname(dest) or ".")
                if sep:rewritten+="#"+anchor
            else:
                assert absolute.is_relative_to(ROOT),str(source)+": outside repository reference"
                rewritten=REPO+quote(absolute.relative_to(ROOT).as_posix(),safe="/")
                if sep:rewritten+="#"+anchor
            return m.group(1)+rewritten+m.group(3)
        text=LINK.sub(change,text)
        if source==SKILL:
            text=text.replace("這是儲存庫內的技能入口，通用規則唯一來源在 docs/production。使用時須保留整個儲存庫的相對路徑；不要只複製此技能資料夾當成完整學生安裝包。","這是由儲存庫產生的自包含部署副本，流程與工作表均在 references。規則主檔仍於 GitHub 的 docs/production；更新後重新打包，不單獨維護本副本。")
        data=text.encode("utf-8");key="payload/"+SLUG+"/"+dest
        files[key]=data;manifest.append({"source":source.relative_to(ROOT).as_posix(),"deployment":key,"sourceSha256":sha(raw),"deploymentSha256":sha(data)})
    for key,data in list(files.items()):
        if not key.endswith(".md"):continue
        for m in LINK.finditer(data.decode("utf-8")):
            url=m.group(2).strip("<>")
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:",url) or url.startswith("#"):continue
            target=posixpath.normpath(posixpath.join(posixpath.dirname(key),unquote(url.partition("#")[0])))
            assert target in files,f"{key}: missing deployment reference {target}"
    files["Install-Windows.ps1"]=b"\xef\xbb\xbf"+WINDOWS.replace("\n","\r\n").encode("utf-8")
    files["Install-Mac.sh"]=MAC.encode("utf-8")
    files["安裝說明.md"]=INSTALL.encode("utf-8")
    files["MANIFEST.json"]=(json.dumps({"version":VERSION,"scope":"canonical_workflow_deployment_only","sources":manifest},ensure_ascii=False,indent=2)+"\n").encode("utf-8")
    files["SHA256SUMS.txt"]="".join(f"{sha(data)}  {key}\n" for key,data in sorted(files.items())).encode("utf-8")
    output=ROOT/"dist";output.mkdir(exist_ok=True);zipped=output/(ROOTNAME+".zip")
    with zipfile.ZipFile(zipped,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for key,data in sorted(files.items()):
            info=zipfile.ZipInfo(ROOTNAME+"/"+key,date_time=(2026,10,4,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=(0o100755 if key.endswith(".sh") else 0o100644)<<16
            z.writestr(info,data)
    with tempfile.TemporaryDirectory(prefix="video-skill-verify-") as td:
        with zipfile.ZipFile(zipped) as z:
            assert z.testzip() is None
            assert all("\\" not in n and n.startswith(ROOTNAME+"/") for n in z.namelist());z.extractall(td)
        extracted=Path(td)/ROOTNAME
        assert {p.relative_to(extracted).as_posix():p.read_bytes() for p in extracted.rglob("*") if p.is_file()}==files
    (output/"SHA256SUMS.txt").write_text(f"{sha(zipped.read_bytes())}  {zipped.name}\n",encoding="utf-8")
    print(json.dumps({"zip":str(zipped),"version":VERSION,"files":len(files),"canonicalSources":len(manifest),"bytes":zipped.stat().st_size,"sha256":sha(zipped.read_bytes()),"deploymentRelativeLinks":"passed","extractedFileEquality":"passed"},ensure_ascii=False))
if __name__=="__main__":build()


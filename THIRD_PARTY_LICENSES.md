# Third-Party Dependencies

本檔記錄 Phase 0 已實際使用或明確評估的第三方元件。產品本身為 private／proprietary，不因使用 MIT 元件而整體改採 MIT。

| Project | Repository | Version / Commit | License | Usage | Distribution / Commercial Risk |
|---|---|---|---|---|---|
| whisper.cpp | https://github.com/ggml-org/whisper.cpp | v1.9.4 / `927cfce34f31707e17f2bff35c349632fb9e2c3a` | MIT | Apple Silicon 本機繁中轉錄 CLI；安裝於使用者本機 cache，不 vendor 進 Repo | 低；若未來隨產品散布 binary，需一併保留 MIT notice |
| ggml large-v3-turbo-q5_0 model | https://huggingface.co/ggerganov/whisper.cpp | SHA-1 `e050f7970618a659205450ad97eb95a18d69c9ee` | MIT（依模型 repository metadata；散布前重驗） | 本機 ASR 權重；只存在使用者 cache | 目前不散布；未來 bundling 前重新確認權重來源、授權與 notice |
| CMake | https://gitlab.kitware.com/cmake/cmake | 3.31.6 | BSD-3-Clause | 只用於本機編譯 whisper.cpp | 不併入產品或輸出 |
| FFmpeg | https://ffmpeg.org/ | 未整合 | LGPL/GPL，依 build options 而異 | 僅列為 CFR proxy 候選；Phase 0 尚未安裝或使用 | 中至高；採用前必須先確認實際 binary build flags 與散布方式 |

macOS `afconvert`、AVFoundation 與 Metal 是作業系統／開發工具能力，不作為 Repo 內第三方程式散布。

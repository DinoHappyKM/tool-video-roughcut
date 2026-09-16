import fs from "fs";
import path from "path";
import { DaVinciXmlBuilder } from "./core/davinciXmlBuilder.js";
import { BRollAnalyzer } from "./core/brollAnalyzer.js";
import { SemanticMatcher } from "./core/semanticMatcher.js";

async function runDemo() {
  console.log("==========================================================");
  console.log(" 🚀 DinoHappyKM: AI 影片初剪 ➔ DaVinci Resolve XML 示範模擬");
  console.log("==========================================================\n");

  // 1. 初始化 B-roll 沙盒資料庫
  const brollAnalyzer = new BRollAnalyzer({
    metadataFile: path.resolve("assets/broll_metadata.json")
  });

  console.log("1. 建立 / 載入 B-roll 沙盒情境標籤庫...");
  // 注入示範 B-roll 元數據（模擬 AI 視覺分析標記完成的情境）
  const sampleBrolls = [
    {
      id: "broll_01",
      filename: "broll_brand_strategy.mp4",
      relativePath: "assets/b_roll/broll_brand_strategy.mp4",
      absolutePath: path.resolve("assets/b_roll/broll_brand_strategy.mp4"),
      durationSeconds: 8.0,
      tags: ["行銷策略", "品牌定位", "會議討論", "白板規劃"],
      sceneDescription: "會議室中行銷主管與團隊在白板前熱烈討論品牌定位與成交路徑",
      mood: "professional"
    },
    {
      id: "broll_02",
      filename: "broll_web_coding.mp4",
      relativePath: "assets/b_roll/broll_web_coding.mp4",
      absolutePath: path.resolve("assets/b_roll/broll_web_coding.mp4"),
      durationSeconds: 6.5,
      tags: ["網站建置", "系統開發", "工程師", "寫程式", "電腦螢幕"],
      sceneDescription: "工程師在雙螢幕前專注建置官方網站與銷售頁面系統",
      mood: "focused"
    },
    {
      id: "broll_03",
      filename: "broll_conversion_chart.mp4",
      relativePath: "assets/b_roll/broll_conversion_chart.mp4",
      absolutePath: path.resolve("assets/b_roll/broll_conversion_chart.mp4"),
      durationSeconds: 7.0,
      tags: ["數據圖表", "成交路徑", "銷售轉換", "營收報表", "成效提升"],
      sceneDescription: "筆電螢幕呈現訪客轉換率與成長走勢圖表特寫",
      mood: "success"
    }
  ];

  brollAnalyzer.metadata.items = sampleBrolls;
  brollAnalyzer.saveMetadata();
  console.log(`   ✓ 已註冊 ${sampleBrolls.length} 支情境 B-roll 素材。\n`);

  // 2. 模擬 A-roll 原始影片與語音逐字稿 (帶精確 Timecode)
  console.log("2. 模擬 A-roll 口播主片音訊轉錄與語意分段...");
  const aRollFile = path.resolve("assets/a_roll/speaker_marketing_overview.mp4");
  const aRollDuration = 35.0; // 35 秒口播

  const transcriptSegments = [
    {
      start: 0.0,
      end: 4.5,
      text: "哈囉大家好！今天我們要來聊聊行銷生態系的完整規劃佈局。",
      keywords: ["行銷生態系", "規劃"]
    },
    {
      start: 4.5,
      end: 12.0,
      text: "首先一切都要從行銷策略開始，把品牌定位確立清楚，並設計出清晰的成交路徑。",
      keywords: ["行銷策略", "品牌定位", "成交路徑"]
    },
    {
      start: 12.0,
      end: 22.0,
      text: "當策略定錨之後，接下來就是數位環境與網站建置，包含官方網站、促購頁與後台系統。",
      keywords: ["網站建置", "系統開發"]
    },
    {
      start: 22.0,
      end: 30.5,
      text: "系統上線後，我們需要看成效數據，監控各個環節的銷售轉換與數據圖表是否達標。",
      keywords: ["數據圖表", "銷售轉換"]
    },
    {
      start: 30.5,
      end: 35.0,
      text: "下一集我們會深入探討影音內容與 AI 剪輯的實戰技巧，請記得訂閱追蹤！",
      keywords: ["AI剪輯", "訂閱"]
    }
  ];
  console.log(`   ✓ 轉錄完成：共 ${transcriptSegments.length} 段語音區間。\n`);

  // 3. 執行語意剪輯比對 (Semantic Matcher)
  console.log("3. AI 剪輯助理比對語意情境與剪輯節奏...");
  const matcher = new SemanticMatcher({
    minBrollDuration: 3.0,
    maxBrollDuration: 4.5,
    initialSpeakerLeadTime: 3.0
  });

  const bRollOverlays = matcher.planRoughCut(transcriptSegments, brollAnalyzer);
  console.log(`   ✓ 規劃產生 ${bRollOverlays.length} 個 B-roll 覆蓋鏡頭 (Track V2)：`);
  bRollOverlays.forEach((cut, i) => {
    console.log(`     [Cut ${i+1}] 時間軸 ${cut.timelineStartSeconds}s ~ ${cut.timelineStartSeconds + (cut.outSeconds - cut.inSeconds)}s: ${cut.name} (${cut.reason})`);
  });
  console.log("");

  // 4. 建置 DaVinci Resolve XML
  console.log("4. 產生標準 DaVinci Resolve FCP 7 XML 格式檔...");
  const builder = new DaVinciXmlBuilder({
    sequenceName: "DinoHappyKM_AI_RoughCut_V1",
    fps: 30,
    width: 1920,
    height: 1080
  });

  // 設定 V1 (A-roll)
  builder.setARollClips([
    {
      name: "speaker_marketing_overview.mp4",
      path: aRollFile,
      inSeconds: 0,
      outSeconds: aRollDuration,
      startSeconds: 0
    }
  ]);

  // 設定 V2 (B-roll)
  builder.setBRollClips(bRollOverlays);

  const xmlContent = builder.generateXml();

  // 輸出至 output 與 examples
  const outputPath = path.resolve("output/davinci_roughcut_demo.xml");
  const examplePath = path.resolve("examples/sample_davinci_roughcut.xml");
  fs.writeFileSync(outputPath, xmlContent, "utf-8");
  fs.writeFileSync(examplePath, xmlContent, "utf-8");

  console.log(`   ✓ XML 成功生成！`);
  console.log(`   - 輸出路徑: ${outputPath}`);
  console.log(`   - 範例路徑: ${examplePath}`);
  console.log("\n==========================================================");
  console.log(" ✅ 完成！您現在可直接在 DaVinci Resolve 中匯入此 XML 測試！");
  console.log("    操作步驟: DaVinci Resolve ➔ File ➔ Import ➔ Timeline (XML)");
  console.log("==========================================================");
}

runDemo().catch(console.error);

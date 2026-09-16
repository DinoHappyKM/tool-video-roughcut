import fs from "fs";
import path from "path";
import { DaVinciXmlBuilder } from "./core/davinciXmlBuilder.js";
import { BRollAnalyzer } from "./core/brollAnalyzer.js";
import { SemanticMatcher } from "./core/semanticMatcher.js";

/**
 * Main rough-cut pipeline runner
 */
export async function runPipeline(options = {}) {
  const aRollDir = options.aRollDir || path.resolve("assets/a_roll");
  const bRollDir = options.bRollDir || path.resolve("assets/b_roll");
  const outputDir = options.outputDir || path.resolve("output");

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const brollAnalyzer = new BRollAnalyzer({ brollDir: bRollDir });
  const scanResult = brollAnalyzer.scanDirectory();
  console.log(`[BRoll] 掃描 B-roll 資料庫: 共有 ${scanResult.total} 支素材 (新增 ${scanResult.added} 支)`);

  // Check for A-roll files
  const aRollFiles = fs.existsSync(aRollDir) 
    ? fs.readdirSync(aRollDir).filter(f => /\.(mp4|mov|m4v|mkv)$/i.test(f))
    : [];

  if (aRollFiles.length === 0) {
    console.log("[Notice] 尚未在 assets/a_roll 放入影片。可執行 `npm run demo` 查看模擬產出效果。");
    return;
  }

  console.log(`[ARoll] 找到 ${aRollFiles.length} 支 A-roll 待處理影片:`, aRollFiles);
  // Pipeline execution for real files can be extended here
}

// Auto-run when executed directly
if (process.argv[1] && process.argv[1].endsWith("index.js")) {
  runPipeline().catch(console.error);
}

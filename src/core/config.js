import fs from "fs";
import path from "path";

/**
 * Lightweight .env parser (zero external dependencies)
 */
export function loadEnv(envPath = ".env") {
  const resolvedPath = path.resolve(envPath);
  if (!fs.existsSync(resolvedPath)) return {};

  const content = fs.readFileSync(resolvedPath, "utf-8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
      env[key] = val;
    }
  }
  return env;
}

/**
 * Get project storage configuration
 */
export function getConfig() {
  loadEnv();

  const mediaRoot = process.env.MEDIA_ROOT ? path.resolve(process.env.MEDIA_ROOT) : null;
  const aRollDir = process.env.A_ROLL_DIR
    ? path.resolve(process.env.A_ROLL_DIR)
    : mediaRoot
    ? path.resolve(mediaRoot, "a_roll")
    : path.resolve("assets/a_roll");

  const bRollDir = process.env.B_ROLL_DIR
    ? path.resolve(process.env.B_ROLL_DIR)
    : mediaRoot
    ? path.resolve(mediaRoot, "b_roll")
    : path.resolve("assets/b_roll");

  const outputDir = process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.resolve("output");

  const metadataFile = process.env.METADATA_FILE
    ? path.resolve(process.env.METADATA_FILE)
    : path.resolve("assets/broll_metadata.json");

  return {
    mediaRoot,
    aRollDir,
    bRollDir,
    outputDir,
    metadataFile
  };
}

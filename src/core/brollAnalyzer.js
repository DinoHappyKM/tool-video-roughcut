import fs from "fs";
import path from "path";

/**
 * B-roll Library Manager and Context Tagging Sandbox
 */
export class BRollAnalyzer {
  constructor(options = {}) {
    this.brollDir = options.brollDir || path.resolve("assets/b_roll");
    this.metadataFile = options.metadataFile || path.resolve("assets/broll_metadata.json");
    this.metadata = this.loadMetadata();
  }

  loadMetadata() {
    if (fs.existsSync(this.metadataFile)) {
      try {
        const raw = fs.readFileSync(this.metadataFile, "utf-8");
        return JSON.parse(raw);
      } catch (err) {
        console.warn("[BRollAnalyzer] Failed to read metadata file, creating new.", err.message);
      }
    }
    return {
      version: "1.0",
      updatedAt: new Date().toISOString(),
      items: []
    };
  }

  saveMetadata() {
    this.metadata.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2), "utf-8");
  }

  /**
   * Scan assets/b_roll folder and register any untracked video files
   */
  scanDirectory() {
    if (!fs.existsSync(this.brollDir)) {
      fs.mkdirSync(this.brollDir, { recursive: true });
    }

    const files = fs.readdirSync(this.brollDir);
    const videoExts = new Set([".mp4", ".mov", ".m4v", ".mkv"]);
    const existingNames = new Set(this.metadata.items.map(i => i.filename));

    let addedCount = 0;
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (videoExts.has(ext) && !existingNames.has(f)) {
        this.metadata.items.push({
          id: `broll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          filename: f,
          relativePath: `assets/b_roll/${f}`,
          durationSeconds: 5.0, // Default baseline, updated by inspection
          tags: ["未分類", path.parse(f).name],
          sceneDescription: `從檔名推斷之情境：${path.parse(f).name}`,
          mood: "neutral",
          analyzedBy: "filename_heuristic"
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      this.saveMetadata();
    }

    return { total: this.metadata.items.length, added: addedCount };
  }

  /**
   * Resolve runtime absolute path for a B-roll item (relative to current brollDir / SSD mount)
   */
  resolveClipPath(item) {
    if (item.absolutePath && fs.existsSync(item.absolutePath)) {
      return item.absolutePath;
    }
    return path.resolve(this.brollDir, item.filename || path.basename(item.relativePath));
  }

  /**
   * Manually or AI tag an item
   */
  tagItem(idOrFilename, updates) {
    const item = this.metadata.items.find(
      i => i.id === idOrFilename || i.filename === idOrFilename
    );
    if (!item) {
      throw new Error(`B-roll item not found: ${idOrFilename}`);
    }
    Object.assign(item, updates);
    this.saveMetadata();
    return item;
  }

  /**
   * Find matching B-roll for given keywords or scene intent
   */
  findMatches(keywords = [], limit = 3) {
    if (this.metadata.items.length === 0) return [];
    
    const scored = this.metadata.items.map(item => {
      let score = 0;
      const allText = [
        ...item.tags,
        item.sceneDescription,
        item.mood,
        item.filename
      ].join(" ").toLowerCase();

      for (const kw of keywords) {
        if (allText.includes(kw.toLowerCase())) {
          score += 2;
        }
      }
      return { item, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.item);
  }
}

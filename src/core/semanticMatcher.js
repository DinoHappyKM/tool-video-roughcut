/**
 * Semantic Matcher & Pacing Director
 * Connects A-roll transcript segments with tagged B-roll footage.
 */
export class SemanticMatcher {
  constructor(options = {}) {
    this.minBrollDuration = options.minBrollDuration || 2.5; // seconds
    this.maxBrollDuration = options.maxBrollDuration || 4.0; // seconds
    this.initialSpeakerLeadTime = options.initialSpeakerLeadTime || 2.0; // Keep speaker face for first 2s
    this.minGapBetweenBroll = options.minGapBetweenBroll || 3.0; // At least 3s of speaker between B-roll
  }

  /**
   * Plan rough cut overlays
   * @param {Array<{start: number, end: number, text: string, keywords: string[]}>} transcriptSegments
   * @param {import("./brollAnalyzer.js").BRollAnalyzer} brollAnalyzer
   */
  planRoughCut(transcriptSegments, brollAnalyzer) {
    const overlays = [];
    let lastBrollEnd = this.initialSpeakerLeadTime;

    for (const segment of transcriptSegments) {
      // Respect pacing rules: don't overlay during initial lead time
      if (segment.start < this.initialSpeakerLeadTime) {
        continue;
      }

      // Check gap since last B-roll
      if (segment.start < lastBrollEnd + this.minGapBetweenBroll) {
        continue;
      }

      // Check if segment has keywords or matching context
      const searchKeywords = segment.keywords || this._extractKeywords(segment.text);
      if (searchKeywords.length === 0) continue;

      const matches = brollAnalyzer.findMatches(searchKeywords, 1);
      if (matches.length > 0) {
        const broll = matches[0];
        const segDuration = segment.end - segment.start;
        const brollDuration = Math.min(
          Math.max(segDuration, this.minBrollDuration),
          this.maxBrollDuration,
          broll.durationSeconds || 5.0
        );

        overlays.push({
          name: broll.filename,
          path: broll.absolutePath,
          inSeconds: 0,
          outSeconds: brollDuration,
          timelineStartSeconds: segment.start,
          reason: `匹配關鍵字 [${searchKeywords.join(", ")}] ➔ ${broll.sceneDescription}`
        });

        lastBrollEnd = segment.start + brollDuration;
      }
    }

    return overlays;
  }

  _extractKeywords(text) {
    if (!text) return [];
    // Basic heuristic keyword extraction for Chinese / English marketing phrases
    const commonStops = new Set(["的", "了", "和", "是", "就", "都", "而", "及", "與", "在", "這", "那", "有", "我", "你", "他", "我們"]);
    // Match 2-4 character phrases or alphanumeric words
    const words = text.match(/[\u4e00-\u9fa5]{2,4}|[a-zA-Z0-9]+/g) || [];
    return words.filter(w => !commonStops.has(w));
  }
}

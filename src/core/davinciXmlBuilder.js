import path from "path";

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Format local path to DaVinci Resolve file URL
 */
function toResolveFileUrl(filePath) {
  const normalized = path.resolve(filePath).replace(/\\/g, "/");
  return `file://localhost/${normalized}`;
}

/**
 * Convert seconds to frame count based on fps
 */
export function secondsToFrames(seconds, fps = 30) {
  return Math.round(seconds * fps);
}

/**
 * DaVinci Resolve FCP 7 XML Generator
 */
export class DaVinciXmlBuilder {
  constructor(options = {}) {
    this.sequenceName = options.sequenceName || "AI_RoughCut_Timeline";
    this.fps = options.fps || 30;
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.aRollTrack = [];
    this.bRollTrack = [];
    this.audioTrack = [];
  }

  /**
   * Set the primary A-roll clips
   * @param {Array<{name: string, path: string, inSeconds: number, outSeconds: number, startSeconds: number}>} clips
   */
  setARollClips(clips) {
    this.aRollTrack = clips.map((c, idx) => ({
      id: `aroll-clip-${idx + 1}`,
      name: c.name || path.basename(c.path),
      path: c.path,
      fileId: `file-aroll-${idx + 1}`,
      start: secondsToFrames(c.startSeconds, this.fps),
      end: secondsToFrames(c.startSeconds + (c.outSeconds - c.inSeconds), this.fps),
      in: secondsToFrames(c.inSeconds, this.fps),
      out: secondsToFrames(c.outSeconds, this.fps),
      duration: secondsToFrames(c.outSeconds - c.inSeconds, this.fps)
    }));
  }

  /**
   * Set B-roll cutaway overlay clips
   * @param {Array<{name: string, path: string, inSeconds: number, outSeconds: number, timelineStartSeconds: number, reason: string}>} clips
   */
  setBRollClips(clips) {
    this.bRollTrack = clips.map((c, idx) => ({
      id: `broll-clip-${idx + 1}`,
      name: c.name || path.basename(c.path),
      path: c.path,
      fileId: `file-broll-${idx + 1}`,
      start: secondsToFrames(c.timelineStartSeconds, this.fps),
      end: secondsToFrames(c.timelineStartSeconds + (c.outSeconds - c.inSeconds), this.fps),
      in: secondsToFrames(c.inSeconds, this.fps),
      out: secondsToFrames(c.outSeconds, this.fps),
      duration: secondsToFrames(c.outSeconds - c.inSeconds, this.fps),
      reason: c.reason || "Semantic context match"
    }));
  }

  /**
   * Generate DaVinci Resolve compatible FCP 7 XML
   */
  generateXml() {
    // Calculate total sequence duration
    let maxFrames = 0;
    for (const c of this.aRollTrack) if (c.end > maxFrames) maxFrames = c.end;
    for (const c of this.bRollTrack) if (c.end > maxFrames) maxFrames = c.end;

    const xmlLines = [];
    xmlLines.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlLines.push('<!DOCTYPE xmeml>');
    xmlLines.push('<xmeml version="5">');
    xmlLines.push('  <sequence id="sequence-1">');
    xmlLines.push(`    <name>${escapeXml(this.sequenceName)}</name>`);
    xmlLines.push(`    <duration>${maxFrames}</duration>`);
    xmlLines.push('    <rate>');
    xmlLines.push(`      <timebase>${this.fps}</timebase>`);
    xmlLines.push('      <ntsc>FALSE</ntsc>');
    xmlLines.push('    </rate>');
    xmlLines.push('    <media>');
    xmlLines.push('      <video>');
    xmlLines.push('        <format>');
    xmlLines.push('          <samplecharacteristics>');
    xmlLines.push(`            <width>${this.width}</width>`);
    xmlLines.push(`            <height>${this.height}</height>`);
    xmlLines.push('            <rate>');
    xmlLines.push(`              <timebase>${this.fps}</timebase>`);
    xmlLines.push('              <ntsc>FALSE</ntsc>');
    xmlLines.push('            </rate>');
    xmlLines.push('          </samplecharacteristics>');
    xmlLines.push('        </format>');

    // Track 1: A-Roll (Main video)
    xmlLines.push('        <track>');
    xmlLines.push('          <!-- Track 1: A-Roll Primary Dialogue -->');
    for (const clip of this.aRollTrack) {
      xmlLines.push(this._buildClipItemXml(clip));
    }
    xmlLines.push('        </track>');

    // Track 2: B-Roll (Cutaway overlays)
    xmlLines.push('        <track>');
    xmlLines.push('          <!-- Track 2: B-Roll Context Overlays -->');
    for (const clip of this.bRollTrack) {
      xmlLines.push(this._buildClipItemXml(clip));
    }
    xmlLines.push('        </track>');
    xmlLines.push('      </video>');

    // Audio Track (A-Roll sound)
    xmlLines.push('      <audio>');
    xmlLines.push('        <track>');
    xmlLines.push('          <!-- Audio Track 1: A-Roll Dialogue -->');
    for (const clip of this.aRollTrack) {
      xmlLines.push(this._buildClipItemXml(clip, true));
    }
    xmlLines.push('        </track>');
    xmlLines.push('      </audio>');

    xmlLines.push('    </media>');
    xmlLines.push('  </sequence>');
    xmlLines.push('</xmeml>');

    return xmlLines.join('\n');
  }

  _buildClipItemXml(clip, isAudio = false) {
    const fileUrl = toResolveFileUrl(clip.path);
    return [
      `          <clipitem id="${clip.id}${isAudio ? '-audio' : ''}">`,
      `            <name>${escapeXml(clip.name)}</name>`,
      `            <duration>${clip.duration}</duration>`,
      `            <rate>`,
      `              <timebase>${this.fps}</timebase>`,
      `              <ntsc>FALSE</ntsc>`,
      `            </rate>`,
      `            <start>${clip.start}</start>`,
      `            <end>${clip.end}</end>`,
      `            <in>${clip.in}</in>`,
      `            <out>${clip.out}</out>`,
      `            <file id="${clip.fileId}">`,
      `              <name>${escapeXml(clip.name)}</name>`,
      `              <pathurl>${escapeXml(fileUrl)}</pathurl>`,
      `              <rate>`,
      `                <timebase>${this.fps}</timebase>`,
      `                <ntsc>FALSE</ntsc>`,
      `              </rate>`,
      `              <duration>${clip.duration}</duration>`,
      `            </file>`,
      clip.reason ? `            <comments>${escapeXml(clip.reason)}</comments>` : '',
      `          </clipitem>`
    ].filter(Boolean).join('\n');
  }
}

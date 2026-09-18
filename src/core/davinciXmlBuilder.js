import path from "path";
import { pathToFileURL } from "url";

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
 * Format local path to DaVinci Resolve FCP 7 XML file URL (Windows & macOS compatible)
 */
export function toResolveFileUrl(filePath) {
  if (/^[a-zA-Z]:[\\/]/.test(filePath)) {
    const normalized = filePath.replace(/\\/g, "/");
    return `file://localhost/${encodeURI(normalized)}`;
  }
  return pathToFileURL(path.resolve(filePath)).href.replace(/^file:\/\/\//, "file://localhost/");
}

/**
 * Convert seconds to frame count based on fps
 */
export function secondsToFrames(seconds, fps = 30) {
  // Decimal timecodes such as 3.70 can land infinitesimally below an exact
  // half-frame in binary floating point. A tiny epsilon prevents a one-frame
  // gap between otherwise contiguous clips.
  return Math.round((seconds * fps) + 1e-7);
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
      duration: secondsToFrames(c.outSeconds - c.inSeconds, this.fps),
      sourceDuration: secondsToFrames(c.sourceDurationSeconds || c.outSeconds, this.fps),
      reason: c.reason || "Approved A-roll cut"
    }));
  }

  /**
   * Generate DaVinci Resolve compatible FCP 7 XML
   */
  generateXml() {
    // Calculate total sequence duration
    let maxFrames = 0;
    for (const c of this.aRollTrack) if (c.end > maxFrames) maxFrames = c.end;

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
      xmlLines.push(this._buildClipItemXml(clip, false, `${clip.id}-audio`));
    }
    xmlLines.push('        </track>');

    xmlLines.push('      </video>');

    // Audio Track (A-Roll sound)
    xmlLines.push('      <audio>');
    xmlLines.push('        <track>');
    xmlLines.push('          <!-- Audio Track 1: A-Roll Dialogue -->');
    for (const clip of this.aRollTrack) {
      xmlLines.push(this._buildClipItemXml(clip, true, clip.id));
    }
    xmlLines.push('        </track>');
    xmlLines.push('      </audio>');

    xmlLines.push('    </media>');
    xmlLines.push('  </sequence>');
    xmlLines.push('</xmeml>');

    return xmlLines.join('\n');
  }

  _buildClipItemXml(clip, isAudio = false, linkedClipId = null) {
    const fileUrl = toResolveFileUrl(clip.path);
    const clipItemId = `${clip.id}${isAudio ? '-audio' : ''}`;
    const mediaType = isAudio ? "audio" : "video";
    return [
      `          <clipitem id="${clipItemId}">`,
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
      `              <duration>${clip.sourceDuration}</duration>`,
      `            </file>`,
      `            <sourcetrack>`,
      `              <mediatype>${mediaType}</mediatype>`,
      ...(isAudio ? [`              <trackindex>1</trackindex>`] : []),
      `            </sourcetrack>`,
      linkedClipId ? `            <link><linkclipref>${linkedClipId}</linkclipref></link>` : "",
      clip.reason ? `            <comments>${escapeXml(clip.reason)}</comments>` : '',
      `          </clipitem>`
    ].filter(Boolean).join('\n');
  }
}

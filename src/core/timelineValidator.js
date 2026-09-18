import fs from "fs";
import path from "path";

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function resolveMediaPath(projectDir, item, mediaById) {
  const media = mediaById.get(item.media_id);
  const sourcePath = item.source_path || media?.source_path;
  if (!sourcePath) return null;
  return path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(projectDir, sourcePath);
}

export function validateTimeline(timeline, options = {}) {
  const projectDir = path.resolve(options.projectDir || ".");
  const project = options.project || { media: { items: [] } };
  const errors = [];
  const warnings = [];
  const warningKeys = new Set();
  const warnOnce = (key, message) => {
    if (warningKeys.has(key)) return;
    warningKeys.add(key);
    warnings.push(message);
  };
  const mediaById = new Map((project.media?.items || []).map(item => [item.media_id, item]));

  if (!timeline || typeof timeline !== "object") {
    return { valid: false, errors: ["timeline must be an object"], warnings };
  }
  if (!timeline.schema_version) errors.push("schema_version is required");
  if (!timeline.project_id) errors.push("project_id is required");
  if (!timeline.output_id) errors.push("output_id is required");
  if (!Number.isInteger(timeline.sequence?.fps) || timeline.sequence.fps <= 0) {
    errors.push("sequence.fps must be a positive integer");
  }

  const videoTracks = timeline.tracks?.video;
  const audioTracks = timeline.tracks?.audio;
  if (!Array.isArray(videoTracks) || videoTracks.length === 0) {
    errors.push("at least one video track is required");
  }
  if (!Array.isArray(audioTracks) || audioTracks.length === 0) {
    errors.push("at least one audio track is required");
  }

  for (const group of [
    ["video", videoTracks || []],
    ["audio", audioTracks || []]
  ]) {
    const [kind, tracks] = group;
    for (const track of tracks) {
      if (!track.track_id) errors.push(`${kind} track is missing track_id`);
      if (!Array.isArray(track.items)) {
        errors.push(`${kind} track ${track.track_id || "<unknown>"} items must be an array`);
        continue;
      }

      const sorted = [...track.items].sort((a, b) => a.timeline_start - b.timeline_start);
      let previousEnd = 0;
      for (const item of sorted) {
        const label = `${kind}/${track.track_id}/${item.clip_id || "<unknown>"}`;
        for (const field of ["source_start", "source_end", "timeline_start", "timeline_end"]) {
          if (!isFiniteNumber(item[field])) errors.push(`${label}.${field} must be a finite number`);
        }
        if (isFiniteNumber(item.source_start) && isFiniteNumber(item.source_end) && item.source_end <= item.source_start) {
          errors.push(`${label} has non-positive source duration`);
        }
        if (isFiniteNumber(item.timeline_start) && isFiniteNumber(item.timeline_end) && item.timeline_end <= item.timeline_start) {
          errors.push(`${label} has non-positive timeline duration`);
        }
        if (
          isFiniteNumber(item.source_start) &&
          isFiniteNumber(item.source_end) &&
          isFiniteNumber(item.timeline_start) &&
          isFiniteNumber(item.timeline_end) &&
          Math.abs((item.source_end - item.source_start) - (item.timeline_end - item.timeline_start)) > 0.001
        ) {
          errors.push(`${label} source and timeline durations do not match`);
        }
        if (isFiniteNumber(item.timeline_start) && item.timeline_start < 0) {
          errors.push(`${label} has a negative timeline start`);
        }
        if (isFiniteNumber(item.timeline_start) && item.timeline_start < previousEnd - 0.000_001) {
          errors.push(`${label} overlaps the previous item on the same track`);
        }
        if (isFiniteNumber(item.timeline_end)) previousEnd = Math.max(previousEnd, item.timeline_end);

        const media = mediaById.get(item.media_id);
        if (!media) {
          errors.push(`${label} references unknown media_id ${item.media_id || "<missing>"}`);
          continue;
        }
        const sourcePath = resolveMediaPath(projectDir, item, mediaById);
        if (!sourcePath || !fs.existsSync(sourcePath)) {
          errors.push(`${label} source media does not exist: ${sourcePath || "<missing path>"}`);
        }
        if (media.variable_frame_rate === true) {
          warnOnce(`vfr:${item.media_id}`, `media ${item.media_id} is variable-frame-rate; verify cut timing in DaVinci Resolve`);
        }
        if (kind === "video" && item.needs_manual_review) {
          warnOnce(`review:${item.clip_id}`, `${label} is marked needs_manual_review`);
        }
      }
    }
  }

  const timelineItems = (videoTracks || []).flatMap(track => track.items || []);
  const calculatedDuration = timelineItems.reduce((max, item) => Math.max(max, item.timeline_end || 0), 0);
  if (isFiniteNumber(timeline.duration_seconds) && Math.abs(timeline.duration_seconds - calculatedDuration) > 0.001) {
    errors.push(`duration_seconds does not match the final video item end (${calculatedDuration})`);
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings
  };
}

export function resolveTimelineMediaPath(projectDir, item, project) {
  const mediaById = new Map((project.media?.items || []).map(media => [media.media_id, media]));
  return resolveMediaPath(path.resolve(projectDir), item, mediaById);
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DaVinciXmlBuilder } from "../core/davinciXmlBuilder.js";
import { buildMulticamManifest } from "../core/multicamManifest.js";
import { resolveTimelineMediaPath, validateTimeline } from "../core/timelineValidator.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function secondsToSrtTime(seconds) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const secs = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function buildSrt(items) {
  return items.map((item, index) => [
    index + 1,
    `${secondsToSrtTime(item.timeline_start)} --> ${secondsToSrtTime(item.timeline_end)}`,
    item.transcript_text || "[待補字幕]",
    ""
  ].join("\n")).join("\n");
}

function buildReport(project, timeline, validation) {
  const primaryVideoTrack = timeline.tracks.video.find(track => track.role === "main_a_roll") || timeline.tracks.video[0];
  const videoItems = primaryVideoTrack.items;
  const bCamTrack = timeline.tracks.video.find(track => track.role === "alternate_camera");
  const titleTrack = timeline.tracks.video.find(track => track.role === "title_cards");
  const bgmTrack = timeline.tracks.audio?.find(track => track.role === "background_music");
  return [
    `# ${timeline.sequence.name}｜Edit Report`,
    "",
    `- Project: ${project.project_name} (${project.project_id})`,
    `- Topic: ${timeline.topic_id}`,
    `- Target Duration: ${timeline.target_duration_seconds}s`,
    `- Final Duration: ${timeline.duration_seconds}s`,
    `- A-roll Cuts: ${videoItems.length}`,
    `- B-camera Cutaways: ${bCamTrack?.items?.length || 0}`,
    `- Title Cards: ${titleTrack?.items?.length || 0}`,
    `- Background Music: ${bgmTrack?.items?.length || 0}`,
    `- Validation: ${validation.valid ? "PASS" : "FAIL"}`,
    "",
    "## Selected A-roll",
    "",
    ...videoItems.map(item => `- ${item.clip_id}: ${item.source_start}s–${item.source_end}s → ${item.timeline_start}s–${item.timeline_end}s — ${item.transcript_text || ""}`),
    ...(bCamTrack?.items?.length ? [
      "",
      "## Selected B-camera alternate angle",
      "",
      ...bCamTrack.items.map(item => `- ${item.clip_id}: ${item.source_start}s–${item.source_end}s → ${item.timeline_start}s–${item.timeline_end}s — ${item.reason || ""}`)
    ] : []),
    ...(titleTrack?.items?.length ? [
      "",
      "## Selected Title Cards",
      "",
      ...titleTrack.items.map(item => `- ${item.clip_id}: ${item.timeline_start}s–${item.timeline_end}s — ${item.name || ""}`)
    ] : []),
    "",
    "## Warnings / Manual Review",
    "",
    ...(validation.warnings.length ? validation.warnings.map(warning => `- ${warning}`) : ["- None"]),
    ""
  ].join("\n");
}

export function buildProject(projectDirInput, options = {}) {
  const projectDir = path.resolve(projectDirInput);
  const project = readJson(path.join(projectDir, "project.json"));
  const timelinePath = path.resolve(projectDir, options.timelinePath || path.join("timeline", "timeline.json"));
  const timeline = readJson(timelinePath);
  const validation = validateTimeline(timeline, { projectDir, project });
  const outputDir = path.join(projectDir, "export", timeline.output_id);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "validation_report.json"), JSON.stringify({
    schema_version: "0.3.0",
    project_id: project.project_id,
    output_id: timeline.output_id,
    ...validation
  }, null, 2));

  if (!validation.valid) {
    throw new Error(`Timeline validation failed:\n${validation.errors.map(error => `- ${error}`).join("\n")}`);
  }

  const primaryVideoTrack = timeline.tracks.video.find(track => track.role === "main_a_roll") || timeline.tracks.video[0];
  const alternateCameraTrack = timeline.tracks.video.find(track => track.role === "alternate_camera");
  const titleCardsTrack = timeline.tracks.video.find(track => track.role === "title_cards");
  const bgmTrack = timeline.tracks.audio?.find(track => track.role === "background_music");

  const mapItemToClip = item => ({
    id: item.clip_id,
    name: item.name,
    path: resolveTimelineMediaPath(projectDir, item, project),
    inSeconds: item.source_start,
    outSeconds: item.source_end,
    startSeconds: item.timeline_start,
    sourceDurationSeconds: project.media.items.find(media => media.media_id === item.media_id)?.duration_seconds,
    reason: item.reason
  });

  const aRollClips = primaryVideoTrack ? primaryVideoTrack.items.map(mapItemToClip) : [];
  const bCamClips = alternateCameraTrack ? alternateCameraTrack.items.map(mapItemToClip) : [];
  const titleClips = titleCardsTrack ? titleCardsTrack.items.map(mapItemToClip) : [];
  const bgmClips = bgmTrack ? bgmTrack.items.map(mapItemToClip) : [];

  const builder = new DaVinciXmlBuilder({
    sequenceName: timeline.sequence.name,
    fps: timeline.sequence.fps,
    width: timeline.sequence.width,
    height: timeline.sequence.height
  });
  builder.setARollClips(aRollClips);
  if (bCamClips.length) builder.setBCamClips(bCamClips);
  if (titleClips.length) builder.setTitleCards(titleClips);
  if (bgmClips.length) builder.setBackgroundMusic(bgmClips);

  const xml = builder.generateXml();
  fs.writeFileSync(path.join(outputDir, `${timeline.output_id}.xml`), xml, "utf8");
  fs.writeFileSync(path.join(outputDir, `${timeline.output_id}.srt`), buildSrt(primaryVideoTrack.items), "utf8");
  fs.writeFileSync(path.join(outputDir, "edit_report.md"), buildReport(project, timeline, validation), "utf8");
  const multicamManifest = buildMulticamManifest(project, timeline, {
    resolveMediaPath: media => path.resolve(projectDir, media.source_path),
    timelineName: `Aperture_${timeline.topic_id}_${timeline.target_duration_seconds}S_${timeline.selected_variant || timeline.variant_id || "A"}`,
    drtOutputPath: path.join(outputDir, `Aperture_${timeline.topic_id}_${timeline.target_duration_seconds}S.drt`)
  });
  if (multicamManifest) {
    fs.writeFileSync(path.join(outputDir, "multicam_manifest.json"), JSON.stringify(multicamManifest, null, 2), "utf8");
  }

  return { projectDir, outputDir, validation };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const projectDir = process.argv[2];
  const timelinePath = process.argv[3];
  if (!projectDir) {
    console.error("Usage: npm run build:project -- /absolute/path/to/project");
    process.exitCode = 2;
  } else {
    try {
      const result = buildProject(projectDir, timelinePath ? { timelinePath } : {});
      console.log(`Validation: PASS (${result.validation.warnings.length} warning(s))`);
      console.log(`Export: ${result.outputDir}`);
      for (const warning of result.validation.warnings) console.warn(`Warning: ${warning}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

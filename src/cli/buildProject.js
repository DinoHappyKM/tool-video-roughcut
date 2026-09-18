import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DaVinciXmlBuilder } from "../core/davinciXmlBuilder.js";
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
  const videoItems = timeline.tracks.video.flatMap(track => track.items);
  return [
    `# ${timeline.sequence.name}｜Edit Report`,
    "",
    `- Project: ${project.project_name} (${project.project_id})`,
    `- Topic: ${timeline.topic_id}`,
    `- Target Duration: ${timeline.target_duration_seconds}s`,
    `- Final Duration: ${timeline.duration_seconds}s`,
    `- A-roll Cuts: ${videoItems.length}`,
    `- Multicam: ${timeline.multicam?.status || "not included"}`,
    `- Titles: ${timeline.deferred_assets?.titles?.status || "not included"}`,
    `- Music: ${timeline.deferred_assets?.music?.status || "not included"}`,
    `- Validation: ${validation.valid ? "PASS" : "FAIL"}`,
    "",
    "## Selected A-roll",
    "",
    ...videoItems.map(item => `- ${item.clip_id}: ${item.source_start}s–${item.source_end}s → ${item.timeline_start}s–${item.timeline_end}s — ${item.transcript_text || ""}`),
    "",
    "## Warnings / Manual Review",
    "",
    ...(validation.warnings.length ? validation.warnings.map(warning => `- ${warning}`) : ["- None"]),
    ""
  ].join("\n");
}

export function buildProject(projectDirInput) {
  const projectDir = path.resolve(projectDirInput);
  const project = readJson(path.join(projectDir, "project.json"));
  const timeline = readJson(path.join(projectDir, "timeline", "timeline.json"));
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
  const clips = primaryVideoTrack.items.map(item => ({
    name: item.name,
    path: resolveTimelineMediaPath(projectDir, item, project),
    inSeconds: item.source_start,
    outSeconds: item.source_end,
    startSeconds: item.timeline_start,
    sourceDurationSeconds: project.media.items.find(media => media.media_id === item.media_id)?.duration_seconds,
    reason: item.reason
  }));

  const builder = new DaVinciXmlBuilder({
    sequenceName: timeline.sequence.name,
    fps: timeline.sequence.fps,
    width: timeline.sequence.width,
    height: timeline.sequence.height
  });
  builder.setARollClips(clips);
  const xml = builder.generateXml();
  fs.writeFileSync(path.join(outputDir, `${timeline.output_id}.xml`), xml, "utf8");
  fs.writeFileSync(path.join(outputDir, `${timeline.output_id}.srt`), buildSrt(primaryVideoTrack.items), "utf8");
  fs.writeFileSync(path.join(outputDir, "edit_report.md"), buildReport(project, timeline, validation), "utf8");

  return { projectDir, outputDir, validation };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const projectDir = process.argv[2];
  if (!projectDir) {
    console.error("Usage: npm run build:project -- /absolute/path/to/project");
    process.exitCode = 2;
  } else {
    try {
      const result = buildProject(projectDir);
      console.log(`Validation: PASS (${result.validation.warnings.length} warning(s))`);
      console.log(`Export: ${result.outputDir}`);
      for (const warning of result.validation.warnings) console.warn(`Warning: ${warning}`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

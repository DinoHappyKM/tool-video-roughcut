import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildProject } from "../src/cli/buildProject.js";

test("buildProject creates XML, SRT, report, and validation output", () => {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "roughcut-project-"));
  fs.mkdirSync(path.join(projectDir, "timeline"));
  fs.writeFileSync(path.join(projectDir, "A.mp4"), "fixture");
  fs.writeFileSync(path.join(projectDir, "project.json"), JSON.stringify({
    project_id: "PROJECT_TEST",
    project_name: "Test Project",
    media: { items: [{ media_id: "CAM_A", source_path: "A.mp4", duration_seconds: 60 }] }
  }));
  const item = {
    clip_id: "CUT_001",
    name: "Test clip",
    media_id: "CAM_A",
    source_start: 10,
    source_end: 12,
    timeline_start: 0,
    timeline_end: 2,
    transcript_text: "測試字幕"
  };
  fs.writeFileSync(path.join(projectDir, "timeline", "timeline.json"), JSON.stringify({
    schema_version: "0.3.0",
    project_id: "PROJECT_TEST",
    output_id: "OUTPUT_TEST",
    topic_id: "T01",
    target_duration_seconds: 2,
    duration_seconds: 2,
    sequence: { name: "Test", fps: 25, width: 1920, height: 1080 },
    tracks: {
      video: [{ track_id: "V1", role: "main_a_roll", items: [item] }],
      audio: [{ track_id: "A1", role: "main_dialogue", items: [{ ...item, clip_id: "CUT_001_AUDIO" }] }]
    }
  }));

  const result = buildProject(projectDir);
  assert.equal(result.validation.valid, true);
  for (const file of ["OUTPUT_TEST.xml", "OUTPUT_TEST.srt", "edit_report.md", "validation_report.json"]) {
    assert.equal(fs.existsSync(path.join(result.outputDir, file)), true, file);
  }
  assert.match(fs.readFileSync(path.join(result.outputDir, "OUTPUT_TEST.srt"), "utf8"), /測試字幕/);
});

test("buildProject emits a native multicam manifest rather than a B-camera overlay", () => {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "roughcut-dual-camera-"));
  fs.mkdirSync(path.join(projectDir, "timeline"));
  fs.writeFileSync(path.join(projectDir, "A.mp4"), "fixture");
  fs.writeFileSync(path.join(projectDir, "B.mp4"), "fixture");
  fs.writeFileSync(path.join(projectDir, "project.json"), JSON.stringify({
    project_id: "PROJECT_DUAL",
    project_name: "Dual Camera",
    media: {
      main_camera_id: "CAM_A",
      main_audio_id: "CAM_A_AUDIO",
      items: [
        { media_id: "CAM_A", role: "main_camera_main_audio", filename: "A.mp4", source_path: "A.mp4", duration_seconds: 60 },
        { media_id: "CAM_B", role: "alternate_camera", filename: "B.mp4", source_path: "B.mp4", duration_seconds: 60 }
      ]
    }
  }));
  const aItem = { clip_id: "A_1", name: "A", media_id: "CAM_A", source_start: 10, source_end: 14, timeline_start: 0, timeline_end: 4, transcript_text: "主聲音" };
  fs.writeFileSync(path.join(projectDir, "timeline", "timeline.json"), JSON.stringify({
    schema_version: "0.3.0", project_id: "PROJECT_DUAL", output_id: "OUTPUT_DUAL", topic_id: "T01", target_duration_seconds: 4, duration_seconds: 4,
    sequence: { name: "Dual", fps: 25, width: 1920, height: 1080 },
    tracks: {
      video: [{ track_id: "V1", role: "main_a_roll", items: [aItem] }],
      audio: [{ track_id: "A1", role: "main_dialogue", items: [{ ...aItem, clip_id: "A_1_AUDIO" }] }]
    }
  }));

  const result = buildProject(projectDir);
  const manifest = JSON.parse(fs.readFileSync(path.join(result.outputDir, "multicam_manifest.json"), "utf8"));
  assert.equal(manifest.multicam_clip.name, "Aperture");
  assert.equal(manifest.multicam_clip.angle_sync_mode, "sound");
  assert.equal(manifest.multicam_clip.program_audio.media_id, "CAM_A");
  assert.deepEqual(manifest.multicam_clip.angle_order.map(angle => angle.media_id), ["CAM_A", "CAM_B"]);
  assert.equal(manifest.edit_decisions.timeline_name, "Aperture_T01_4S_A");
  assert.equal(manifest.edit_decisions.default_video_angle_media_id, "CAM_A");
  assert.deepEqual(manifest.edit_decisions.segments, [{
    clip_id: "A_1",
    source_start_seconds: 10,
    source_end_seconds: 14,
    timeline_start_seconds: 0,
    timeline_end_seconds: 4
  }]);
});

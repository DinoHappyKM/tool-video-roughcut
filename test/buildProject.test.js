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

test("buildProject exports B-camera picture cuts without adding B-camera audio", () => {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "roughcut-dual-camera-"));
  fs.mkdirSync(path.join(projectDir, "timeline"));
  fs.writeFileSync(path.join(projectDir, "A.mp4"), "fixture");
  fs.writeFileSync(path.join(projectDir, "B.mp4"), "fixture");
  fs.writeFileSync(path.join(projectDir, "project.json"), JSON.stringify({
    project_id: "PROJECT_DUAL",
    project_name: "Dual Camera",
    media: { items: [
      { media_id: "CAM_A", source_path: "A.mp4", duration_seconds: 60 },
      { media_id: "CAM_B", source_path: "B.mp4", duration_seconds: 60 }
    ] }
  }));
  const aItem = { clip_id: "A_1", name: "A", media_id: "CAM_A", source_start: 10, source_end: 14, timeline_start: 0, timeline_end: 4, transcript_text: "主聲音" };
  const bItem = { clip_id: "B_1", name: "B", media_id: "CAM_B", source_start: 8.76, source_end: 12.76, timeline_start: 0, timeline_end: 4, reason: "Alternate angle" };
  fs.writeFileSync(path.join(projectDir, "timeline", "timeline_dual.json"), JSON.stringify({
    schema_version: "0.3.0", project_id: "PROJECT_DUAL", output_id: "OUTPUT_DUAL", topic_id: "T01", target_duration_seconds: 4, duration_seconds: 4,
    sequence: { name: "Dual", fps: 25, width: 1920, height: 1080 },
    tracks: {
      video: [
        { track_id: "V1", role: "main_a_roll", items: [aItem] },
        { track_id: "V2", role: "alternate_camera", items: [bItem] }
      ],
      audio: [{ track_id: "A1", role: "main_dialogue", items: [{ ...aItem, clip_id: "A_1_AUDIO" }] }]
    }
  }));

  const result = buildProject(projectDir, { timelinePath: "timeline/timeline_dual.json" });
  const xml = fs.readFileSync(path.join(result.outputDir, "OUTPUT_DUAL.xml"), "utf8");
  assert.match(xml, /<clipitem id="bcam-clip-1">/);
  assert.match(xml, /<name>B<\/name>/);
  assert.equal((xml.match(/<mediatype>audio<\/mediatype>/g) || []).length, 1);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateTimeline } from "../src/core/timelineValidator.js";

function fixture() {
  const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "roughcut-test-"));
  fs.writeFileSync(path.join(projectDir, "A.mp4"), "fixture");
  const project = {
    media: { items: [{ media_id: "CAM_A", source_path: "A.mp4", variable_frame_rate: true }] }
  };
  const clip = {
    clip_id: "CUT_001",
    media_id: "CAM_A",
    source_start: 10,
    source_end: 12,
    timeline_start: 0,
    timeline_end: 2
  };
  const timeline = {
    schema_version: "0.3.0",
    project_id: "PROJECT_TEST",
    output_id: "OUTPUT_TEST",
    sequence: { fps: 25 },
    tracks: {
      video: [{ track_id: "V1", items: [clip] }],
      audio: [{ track_id: "A1", items: [{ ...clip, clip_id: "CUT_001_AUDIO" }] }]
    }
  };
  return { projectDir, project, timeline };
}

test("valid timeline passes and exposes the VFR warning", () => {
  const data = fixture();
  const result = validateTimeline(data.timeline, data);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some(warning => warning.includes("variable-frame-rate")));
});
test("overlap and missing media fail validation", () => {
  const data = fixture();
  data.timeline.tracks.video[0].items.push({
    ...data.timeline.tracks.video[0].items[0],
    clip_id: "CUT_002",
    media_id: "MISSING",
    timeline_start: 1,
    timeline_end: 3
  });
  const result = validateTimeline(data.timeline, data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes("overlaps")));
  assert.ok(result.errors.some(error => error.includes("unknown media_id")));
});

import assert from "node:assert/strict";
import test from "node:test";
import { DaVinciXmlBuilder, secondsToFrames, toResolveFileUrl } from "../src/core/davinciXmlBuilder.js";

test("secondsToFrames rounds to the nearest frame", () => {
  assert.equal(secondsToFrames(1.02, 25), 26);
  assert.equal(secondsToFrames(3.70, 25), 93);
});

test("toResolveFileUrl encodes spaces and Traditional Chinese", () => {
  const url = toResolveFileUrl("/tmp/種鑽石 主影片.mp4");
  assert.equal(url, "file://localhost/tmp/%E7%A8%AE%E9%91%BD%E7%9F%B3%20%E4%B8%BB%E5%BD%B1%E7%89%87.mp4");
});

test("toResolveFileUrl keeps Windows drive paths portable", () => {
  assert.equal(toResolveFileUrl("E:\\Media\\A Roll.mp4"), "file://localhost/E:/Media/A%20Roll.mp4");
});

test("builder emits linked video and audio clipitems", () => {
  const builder = new DaVinciXmlBuilder({ fps: 25 });
  builder.setARollClips([{
    name: "A.mp4",
    path: "/tmp/A.mp4",
    inSeconds: 10,
    outSeconds: 12,
    startSeconds: 0,
    sourceDurationSeconds: 60
  }]);
  const xml = builder.generateXml();
  assert.match(xml, /<clipitem id="aroll-clip-1">/);
  assert.match(xml, /<clipitem id="aroll-clip-1-audio">/);
  assert.match(xml, /<linkclipref>aroll-clip-1-audio<\/linkclipref>/);
  assert.match(xml, /<duration>1500<\/duration>/);
});

test("contiguous decimal-second clips stay contiguous after frame conversion", () => {
  const builder = new DaVinciXmlBuilder({ fps: 25 });
  builder.setARollClips([
    { name: "A1", path: "/tmp/A.mp4", inSeconds: 172.94, outSeconds: 176.64, startSeconds: 0 },
    { name: "A2", path: "/tmp/A.mp4", inSeconds: 176.64, outSeconds: 182.64, startSeconds: 3.70 }
  ]);
  const xml = builder.generateXml();
  assert.match(xml, /<end>93<\/end>[\s\S]*?<clipitem id="aroll-clip-2">[\s\S]*?<start>93<\/start>/);
});

#!/usr/bin/env python3
"""Create the Resolve-native Multicam Clip described by multicam_manifest.json.

Run this *inside DaVinci Resolve* from Workspace > Scripts > Edit. It never
modifies source media. It creates a Media Pool Multicam Clip named Aperture.
"""

import json
import os
import sys


DEFAULT_MANIFEST = os.environ.get("ROUGH_CUT_MULTICAM_MANIFEST", "")


def fail(message):
    print("[Aperture Multicam] ERROR: " + message)
    raise RuntimeError(message)


def configured_manifest_path():
    if DEFAULT_MANIFEST:
        return DEFAULT_MANIFEST
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "create_aperture_multicam.config.json")
    if os.path.isfile(config_path):
        with open(config_path, "r", encoding="utf-8") as handle:
            return json.load(handle).get("manifest_path", "")
    return ""


def all_media_items(folder):
    items = list(folder.GetClipList() or [])
    for child in folder.GetSubFolderList() or []:
        items.extend(all_media_items(child))
    return items


def source_path(item):
    properties = item.GetClipProperty() or {}
    return os.path.normcase(os.path.normpath(properties.get("File Path", "")))


def find_media_item(media_pool, expected_path, expected_name):
    normalized_path = os.path.normcase(os.path.normpath(expected_path))
    matches = []
    for item in all_media_items(media_pool.GetRootFolder()):
        if source_path(item) == normalized_path:
            return item
        if item.GetName() == expected_name:
            matches.append(item)
    if len(matches) == 1:
        return matches[0]
    return None


def find_named_media_item(media_pool, name):
    for item in all_media_items(media_pool.GetRootFolder()):
        if item.GetName() == name:
            return item
    return None


def find_timeline(project, name):
    for index in range(1, project.GetTimelineCount() + 1):
        timeline = project.GetTimelineByIndex(index)
        if timeline and timeline.GetName() == name:
            return timeline
    return None


def main(manifest_path):
    if not manifest_path:
        fail("Set ROUGH_CUT_MULTICAM_MANIFEST to the absolute multicam_manifest.json path before running.")
    with open(manifest_path, "r", encoding="utf-8") as handle:
        manifest = json.load(handle)

    try:
        resolve = bmd.scriptapp("Resolve")
    except NameError:
        import DaVinciResolveScript as dvr_script
        resolve = dvr_script.scriptapp("Resolve")
    project = resolve.GetProjectManager().GetCurrentProject()
    if not project:
        fail("Open the target Resolve project before running this script.")
    media_pool = project.GetMediaPool()
    spec = manifest["multicam_clip"]
    name = spec["name"]
    multicam = find_named_media_item(media_pool, name)
    if not multicam:
        clips = []
        manifest_dir = os.path.dirname(manifest_path)
        for angle in spec["angle_order"]:
            expected_path = angle["source_path"]
            if not os.path.isabs(expected_path):
                expected_path = os.path.normpath(os.path.join(manifest_dir, expected_path))
            item = find_media_item(media_pool, expected_path, angle["filename"])
            if not item:
                imported = media_pool.ImportMedia([expected_path]) or []
                item = imported[0] if imported else None
                if item:
                    print("[Aperture Multicam] Imported source: " + angle["filename"])
            if not item:
                fail("Resolve could not import this source: " + angle["filename"])
            clips.append(item)

        options = {
            "name": name,
            "frameRate": spec["frame_rate"],
            "angleSyncMode": resolve.MULTICAM_ANGLE_SYNC_AUDIO,
            "multicamAudioMode": resolve.MULTICAM_AUDIO_SOURCE,
            "angleNameMode": resolve.MULTICAM_ANGLE_NAME_CLIP,
            "useFullClipExtents": True,
            "splitAtGaps": False,
            "createBinForSourceClips": False,
            "detectSameCameraClipsMode": resolve.MULTICAM_DETECT_NONE,
        }
        created = media_pool.CreateMulticamClip(clips, options)
        if not created:
            fail("Resolve did not create the Multicam Clip. Check Sound sync manually, then retry.")
        multicam = created[0] if isinstance(created, (list, tuple)) else created
        print("[Aperture Multicam] Created native Multicam Clip: " + name)
    else:
        print("[Aperture Multicam] Reusing existing native Multicam Clip: " + name)

    edit = manifest.get("edit_decisions", {})
    timeline_name = edit.get("timeline_name", name + "_RoughCut")
    timeline = find_timeline(project, timeline_name)
    if not timeline:
        fps = float(spec["frame_rate"])
        clip_infos = []
        for segment in edit.get("segments", []):
            clip_infos.append({
                "mediaPoolItem": multicam,
                "startFrame": round(float(segment["source_start_seconds"]) * fps),
                "endFrame": round(float(segment["source_end_seconds"]) * fps),
                "recordFrame": round(float(segment["timeline_start_seconds"]) * fps),
            })
        if not clip_infos:
            fail("The manifest contains no approved A-roll segments for the multicam timeline.")
        timeline = media_pool.CreateTimelineFromClips(timeline_name, clip_infos)
        if not timeline:
            fail("Resolve created the Multicam Clip but could not create the rough-cut timeline.")
        print("[Aperture Multicam] Created switchable rough-cut timeline: " + timeline_name)
    else:
        print("[Aperture Multicam] Reusing existing rough-cut timeline: " + timeline_name)

    project.SetCurrentTimeline(timeline)
    drt_path = edit.get("export_drt_path")
    if drt_path:
        os.makedirs(os.path.dirname(drt_path), exist_ok=True)
        if timeline.Export(drt_path, resolve.EXPORT_DRT, resolve.EXPORT_NONE):
            print("[Aperture Multicam] Exported Resolve Timeline: " + drt_path)
        else:
            print("[Aperture Multicam] WARNING: Timeline exists in Resolve, but DRT export failed.")
    resolve.GetProjectManager().SaveProject()
    print("[Aperture Multicam] Angle 1 = CAM_A video + program audio; Angle 2 = CAM_B.")


if __name__ == "__main__":
    main(configured_manifest_path())

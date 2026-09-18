"""Create the Resolve-native Multicam Clip described by multicam_manifest.json.

Run this *inside DaVinci Resolve* from Workspace > Scripts > Utility. It never
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


def multicam_exists(media_pool, name):
    return any(item.GetName() == name for item in all_media_items(media_pool.GetRootFolder()))


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
    if multicam_exists(media_pool, name):
        print("[Aperture Multicam] Already exists: " + name)
        return

    clips = []
    manifest_dir = os.path.dirname(manifest_path)
    for angle in spec["angle_order"]:
        expected_path = angle["source_path"]
        if not os.path.isabs(expected_path):
            expected_path = os.path.normpath(os.path.join(manifest_dir, expected_path))
        item = find_media_item(media_pool, expected_path, angle["filename"])
        if not item:
            fail("Import this source into the Media Pool first: " + angle["filename"])
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
    multicam = media_pool.CreateMulticamClip(clips, options)
    if not multicam:
        fail("Resolve did not create the Multicam Clip. Check Sound sync manually, then retry.")
    print("[Aperture Multicam] Created native Multicam Clip: " + name)
    print("[Aperture Multicam] Angle 1 = CAM_A video + program audio; Angle 2 = CAM_B.")


if __name__ == "__main__":
    main(configured_manifest_path())

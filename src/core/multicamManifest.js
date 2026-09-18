/**
 * Build the hand-off contract for a DaVinci Resolve native Multicam Clip.
 *
 * FCP 7 XML represents video tracks, not Resolve's editable Multicam Clip
 * database object. Keeping this as a separate artifact prevents a B camera
 * from being accidentally exported as a composited V2 overlay.
 */
export function buildMulticamManifest(project, timeline, options = {}) {
  const mainCameraId = project.media?.main_camera_id;
  const mainAudioId = project.media?.main_audio_id;
  const cameras = project.media?.items || [];
  const mainCamera = cameras.find(item => item.media_id === mainCameraId);
  const alternateCamera = cameras.find(item => item.role === "alternate_camera");

  if (!mainCamera || !alternateCamera) {
    return null;
  }

  return {
    schema_version: "0.3.0",
    artifact_type: "resolve_native_multicam_manifest",
    project_id: project.project_id,
    output_id: timeline.output_id,
    status: "pending_resolve_creation",
    multicam_clip: {
      name: options.name || "Aperture",
      frame_rate: timeline.sequence.fps,
      angle_sync_mode: "sound",
      use_full_clip_extents: true,
      angle_name_mode: "clip_name",
      program_audio: {
        media_id: mainCameraId,
        audio_id: mainAudioId,
        resolve_mode: "source",
        note: "CAM_A must be first in angle_order so Resolve SOURCE audio remains CAM_A."
      },
      angle_order: [
        {
          angle_index: 1,
          media_id: mainCamera.media_id,
          role: "main_camera_main_audio",
          filename: mainCamera.filename,
          source_path: options.resolveMediaPath ? options.resolveMediaPath(mainCamera) : mainCamera.source_path
        },
        {
          angle_index: 2,
          media_id: alternateCamera.media_id,
          role: "alternate_camera",
          filename: alternateCamera.filename,
          source_path: options.resolveMediaPath ? options.resolveMediaPath(alternateCamera) : alternateCamera.source_path
        }
      ]
    },
    edit_decisions: {
      status: "not_auto_switched",
      policy: "Create the native Multicam Clip first. Do not emit B-camera V2 overlays. Angle switching remains editable in Resolve after sync review."
    },
    manual_review: [
      "Both sources are VFR. Verify a visible spoken phrase after Resolve's Sound sync before making angle decisions.",
      "CAM_A is the required program audio; do not use CAM_B audio as the program source."
    ]
  };
}

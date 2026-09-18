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

  const primaryVideoTrack = timeline.tracks?.video?.find(track => track.role === "main_a_roll") || timeline.tracks?.video?.[0];
  const multicamName = options.name || "Aperture";

  return {
    schema_version: "0.3.0",
    artifact_type: "resolve_native_multicam_manifest",
    project_id: project.project_id,
    output_id: timeline.output_id,
    status: "pending_resolve_creation",
    multicam_clip: {
      name: multicamName,
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
      status: "default_angle_a_pending_resolve_creation",
      policy: "Create a Resolve-native Multicam Clip and a rough-cut timeline made from that clip. Default picture and program audio are CAM_A; every segment remains switchable to CAM_B in Resolve.",
      timeline_name: options.timelineName || `${multicamName}_${timeline.topic_id}_${timeline.target_duration_seconds}S_${timeline.selected_variant || timeline.variant_id || "A"}`,
      export_drt_path: options.drtOutputPath || null,
      default_video_angle_media_id: mainCameraId,
      program_audio_media_id: mainCameraId,
      segments: (primaryVideoTrack?.items || []).map(item => ({
        clip_id: item.clip_id,
        source_start_seconds: item.source_start,
        source_end_seconds: item.source_end,
        timeline_start_seconds: item.timeline_start,
        timeline_end_seconds: item.timeline_end
      }))
    },
    manual_review: [
      "Both sources are VFR. Verify a visible spoken phrase after Resolve's Sound sync before making angle decisions.",
      "CAM_A is the required program audio; do not use CAM_B audio as the program source."
    ]
  };
}

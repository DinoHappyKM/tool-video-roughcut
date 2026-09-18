-- Create a Resolve-native Multicam Clip and an editable rough-cut timeline.
-- Run inside Resolve from Workspace > Scripts > Edit.

local function fail(message)
    print("[Aperture Multicam] ERROR: " .. message)
    error(message)
end

local scriptSource = debug.getinfo(1, "S").source
local scriptPath = scriptSource:sub(1, 1) == "@" and scriptSource:sub(2) or scriptSource
local scriptDir = scriptPath:match("^(.*[/\\])") or "./"
local configPath = scriptDir .. "create_aperture_multicam.config"
local configFile = io.open(configPath, "r")
if not configFile then
    fail("Missing config: " .. configPath)
end
configFile:close()
local config = dofile(configPath)

local resolve = bmd.scriptapp("Resolve")
if not resolve then
    fail("Resolve scripting is unavailable in this session.")
end
local projectManager = resolve:GetProjectManager()
local project = projectManager:GetCurrentProject()
if not project then
    fail("Open the target Resolve project before running this script.")
end
local mediaPool = project:GetMediaPool()

local function allMediaItems(folder, result)
    result = result or {}
    for _, item in ipairs(folder:GetClipList() or {}) do
        table.insert(result, item)
    end
    for _, child in ipairs(folder:GetSubFolderList() or {}) do
        allMediaItems(child, result)
    end
    return result
end

local function normalizedPath(path)
    return string.lower((path or ""):gsub("\\", "/"))
end

local function findMediaItem(expectedPath, expectedName)
    local pathMatch = normalizedPath(expectedPath)
    local nameMatches = {}
    for _, item in ipairs(allMediaItems(mediaPool:GetRootFolder())) do
        local properties = item:GetClipProperty() or {}
        if normalizedPath(properties["File Path"]) == pathMatch then
            return item
        end
        if item:GetName() == expectedName then
            table.insert(nameMatches, item)
        end
    end
    if #nameMatches == 1 then
        return nameMatches[1]
    end
    return nil
end

local function findNamedMediaItem(name)
    for _, item in ipairs(allMediaItems(mediaPool:GetRootFolder())) do
        if item:GetName() == name then
            return item
        end
    end
    return nil
end

local function findExistingMulticam()
    local preferred = findNamedMediaItem(config.multicam_name)
    if preferred then
        return preferred
    end
    for _, item in ipairs(allMediaItems(mediaPool:GetRootFolder())) do
        local lowerName = string.lower(item:GetName() or "")
        if string.find(lowerName, "multicam", 1, true) then
            return item
        end
    end
    return nil
end

local function findTimeline(name)
    for index = 1, project:GetTimelineCount() do
        local timeline = project:GetTimelineByIndex(index)
        if timeline and timeline:GetName() == name then
            return timeline
        end
    end
    return nil
end

local multicam = findExistingMulticam()
if multicam then
    print("[Aperture Multicam] Reusing existing Multicam Clip: " .. multicam:GetName())
else
    local clips = {}
    for _, angle in ipairs(config.angles) do
        local item = findMediaItem(angle.source_path, angle.filename)
        if not item then
            local imported = mediaPool:ImportMedia({angle.source_path}) or {}
            item = imported[1]
            if item then
                print("[Aperture Multicam] Imported source: " .. angle.filename)
            end
        end
        if not item then
            fail("Resolve could not import source: " .. angle.filename)
        end
        table.insert(clips, item)
    end

    local options = {
        name = config.multicam_name,
        frameRate = config.fps,
        angleSyncMode = resolve.MULTICAM_ANGLE_SYNC_AUDIO,
        channelConfig = 1,
        multicamAudioMode = resolve.MULTICAM_AUDIO_SOURCE,
        angleNameMode = resolve.MULTICAM_ANGLE_NAME_CLIP,
        useFullClipExtents = true,
        splitAtGaps = false,
        createBinForSourceClips = false,
        detectSameCameraClipsMode = resolve.MULTICAM_DETECT_NONE,
    }
    local created = mediaPool:CreateMulticamClip(clips, options)
    if type(created) == "table" then
        multicam = created[1]
    else
        multicam = created
    end
    if not multicam then
        fail("Resolve did not create the Multicam Clip.")
    end
    print("[Aperture Multicam] Created Multicam Clip: " .. config.multicam_name)
end

local timeline = findTimeline(config.timeline_name)
if not timeline then
    local clipInfos = {}
    for _, segment in ipairs(config.segments) do
        table.insert(clipInfos, {
            mediaPoolItem = multicam,
            startFrame = math.floor((segment.source_start_seconds * config.fps) + 0.5),
            endFrame = math.floor((segment.source_end_seconds * config.fps) + 0.5),
            recordFrame = math.floor((segment.timeline_start_seconds * config.fps) + 0.5),
        })
    end
    timeline = mediaPool:CreateTimelineFromClips(config.timeline_name, clipInfos)
    if not timeline then
        fail("Resolve could not create the switchable multicam rough-cut timeline.")
    end
    print("[Aperture Multicam] Created timeline: " .. config.timeline_name)
else
    print("[Aperture Multicam] Reusing timeline: " .. config.timeline_name)
end

project:SetCurrentTimeline(timeline)
if config.drt_output_path and config.drt_output_path ~= "" then
    local exported = timeline:Export(config.drt_output_path, resolve.EXPORT_DRT, resolve.EXPORT_NONE)
    if exported then
        print("[Aperture Multicam] Exported DRT: " .. config.drt_output_path)
    else
        print("[Aperture Multicam] WARNING: Timeline exists but DRT export failed.")
    end
end
projectManager:SaveProject()
print("[Aperture Multicam] Complete. Every timeline segment remains a native switchable Multicam Clip.")

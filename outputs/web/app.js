(function () {
  "use strict";

  const TRACK_HEIGHT = 48;
  const MIN_CLIP_DURATION = 0.25;
  const DEFAULT_TRACK_COUNT = 5;

  const els = {
    actionButtons: Array.from(document.querySelectorAll("[data-action]")),
    appShell: document.getElementById("appShell"),
    assetList: document.getElementById("assetList"),
    backgroundButtons: Array.from(document.querySelectorAll("[data-bg-preset], [data-bg-transparent]")),
    backgroundColorInput: document.getElementById("backgroundColorInput"),
    clearMediaButton: document.getElementById("clearMediaButton"),
    clipsLayer: document.getElementById("clipsLayer"),
    dropZone: document.getElementById("dropZone"),
    bitrateInput: document.getElementById("bitrateInput"),
    exportButton: document.getElementById("exportButton"),
    exportFormatLabel: document.getElementById("exportFormatLabel"),
    exportOptionsPanel: document.getElementById("exportOptionsPanel"),
    exportPanelToggle: document.getElementById("exportPanelToggle"),
    formatButtons: Array.from(document.querySelectorAll("[data-format]")),
    frameButtons: Array.from(document.querySelectorAll("[data-frame-ratio]")),
    fileInput: document.getElementById("fileInput"),
    fpsInput: document.getElementById("fpsInput"),
    gradientAddButton: document.getElementById("gradientAddButton"),
    gradientAngleInput: document.getElementById("gradientAngleInput"),
    gradientColorInput: document.getElementById("gradientColorInput"),
    gradientPanel: document.getElementById("gradientPanel"),
    gradientRemoveButton: document.getElementById("gradientRemoveButton"),
    gradientScaleInput: document.getElementById("gradientScaleInput"),
    gradientStopList: document.getElementById("gradientStopList"),
    gradientToggleButton: document.getElementById("gradientToggleButton"),
    gradientTypeInput: document.getElementById("gradientTypeInput"),
    applyImageGridButton: document.getElementById("applyImageGridButton"),
    gridSecondsInput: document.getElementById("gridSecondsInput"),
    imageGridInput: document.getElementById("imageGridInput"),
    includeAudioInput: document.getElementById("includeAudioInput"),
    importButton: document.getElementById("importButton"),
    mediaResetButton: document.getElementById("mediaResetButton"),
    mediaScaleInput: document.getElementById("mediaScaleInput"),
    mediaStatus: document.getElementById("mediaStatus"),
    optimizeInput: document.getElementById("optimizeInput"),
    outputLengthInput: document.getElementById("outputLengthInput"),
    playButton: document.getElementById("playButton"),
    playhead: document.getElementById("playhead"),
    playheadRange: document.getElementById("playheadRange"),
    previewAudio: document.getElementById("previewAudio"),
    previewImage: document.getElementById("previewImage"),
    previewStatus: document.getElementById("previewStatus"),
    previewVisualLayer: document.getElementById("previewVisualLayer"),
    previewVideo: document.getElementById("previewVideo"),
    qualityInput: document.getElementById("qualityInput"),
    rulerContent: document.getElementById("rulerContent"),
    outputWidthInput: document.getElementById("outputWidthInput"),
    renderStatus: document.getElementById("renderStatus"),
    selectAllMediaButton: document.getElementById("selectAllMediaButton"),
    snapInput: document.getElementById("snapInput"),
    stopButton: document.getElementById("stopButton"),
    timeReadout: document.getElementById("timeReadout"),
    timelineContent: document.getElementById("timelineContent"),
    timelineDropHint: document.getElementById("timelineDropHint"),
    timelineGrid: document.getElementById("timelineGrid"),
    timelineRuler: document.getElementById("timelineRuler"),
    timelineScroll: document.getElementById("timelineScroll"),
    timelineStatus: document.getElementById("timelineStatus"),
    trackLabels: document.getElementById("trackLabels"),
    viewerFrame: document.getElementById("viewerFrame"),
    viewerPlaceholder: document.getElementById("viewerPlaceholder"),
    viewerStage: document.getElementById("viewerStage"),
    gridSecondsDownButton: document.getElementById("gridSecondsDownButton"),
    gridSecondsUpButton: document.getElementById("gridSecondsUpButton"),
    zoomInput: document.getElementById("zoomInput"),
  };

  const FRAME_RATIOS = {
    "1:1": { width: 1, height: 1 },
    "16:9": { width: 16, height: 9 },
    "4:5": { width: 4, height: 5 },
    "3:4": { width: 3, height: 4 },
  };

  const state = {
    assets: [],
    backgroundColor: "#ffffff",
    backgroundMode: "solid",
    clips: [],
    drag: null,
    exportConfigured: false,
    exportFormat: "mp4",
    exportPanelOpen: false,
    frameRatioKey: null,
    frameRatioPhase: 0,
    freeGradientPoints: [],
    gradientAngle: 0,
    gradientPanelOpen: false,
    gradientScale: 100,
    gradientStops: [
      { color: "#ffffff", position: 0 },
      { color: "#000000", position: 100 },
    ],
    gradientType: "linear",
    gridSeconds: 1,
    imageGridLength: 3,
    lastFrameTime: 0,
    mediaDrag: null,
    mediaOffsetX: 0,
    mediaOffsetY: 0,
    mediaScale: 1,
    playhead: 0,
    playheadDragging: false,
    previewAudioPlayers: new Map(),
    previewVisualItems: new Map(),
    renderEnd: 0,
    renderEndAuto: true,
    renderEndDragging: false,
    playing: false,
    previewClipId: null,
    rendering: false,
    selectedAssetId: null,
    selectedAssetIds: [],
    selectedClipId: null,
    selectedClipIds: [],
    selectionDrag: null,
    sequenceDuration: 12,
    snap: true,
    tracks: createDefaultTracks(),
    zoom: 82,
  };

  const EXPORT_FORMATS = {
    gif: {
      extension: "gif",
      label: "gif",
      nativeOnly: true,
    },
    mov: {
      extension: "mov",
      label: "mov lossless",
      nativeOnly: true,
    },
    mp4: {
      extension: "mp4",
      label: "mp4 optimized",
      mimeCandidates: [
        "video/mp4;codecs=avc1.42E01E",
        "video/mp4;codecs=h264",
        "video/mp4",
      ],
    },
    "zip-jpg": {
      extension: "zip",
      frameMime: "image/jpeg",
      label: "zip frames jpg",
      zipFrames: true,
    },
    "zip-png": {
      extension: "zip",
      frameMime: "image/png",
      label: "zip frames png",
      zipFrames: true,
    },
  };

  function createDefaultTracks() {
    return Array.from({ length: DEFAULT_TRACK_COUNT }, (_, index) => ({
      id: createId("track"),
      name: `layer ${index + 1}`,
      volume: 1,
    }));
  }

  function createId(prefix) {
    if (crypto && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseDecimalInput(value, fallback) {
    const normalized = String(value).trim().replace(",", ".");
    if (!normalized) return fallback;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatDecimalInput(value) {
    return Number(value.toFixed(3)).toString();
  }

  function getFrameRatio() {
    const ratio = FRAME_RATIOS[state.frameRatioKey];
    if (!ratio) return null;
    if (state.frameRatioPhase === 1 && ratio.width !== ratio.height) {
      return { width: ratio.height, height: ratio.width };
    }
    return ratio;
  }

  function getOutputAspect() {
    return getFrameRatio() || { width: 16, height: 9 };
  }

  function getRatioLabel(ratio) {
    return `${ratio.width}:${ratio.height}`;
  }

  function cycleFrameRatio(key) {
    if (!FRAME_RATIOS[key]) return;
    if (state.frameRatioKey !== key) {
      state.frameRatioKey = key;
      state.frameRatioPhase = 0;
    } else if (state.frameRatioPhase === 0) {
      state.frameRatioPhase = 1;
    } else {
      state.frameRatioKey = null;
      state.frameRatioPhase = 0;
    }
    applyCompositionStyles();
  }

  function resetMediaTransform() {
    const clip = getSelectedVisualClip();
    if (!clip) return;
    clip.mediaOffsetX = 0;
    clip.mediaOffsetY = 0;
    clip.mediaScale = 1;
    applyCompositionStyles();
    updatePreview(true);
  }

  function hexToRgb(color) {
    const value = String(color || "#000000").replace("#", "");
    const normalized = value.length === 3
      ? value.split("").map((part) => part + part).join("")
      : value.padEnd(6, "0").slice(0, 6);
    const parsed = Number.parseInt(normalized, 16);
    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
  }

  function transparentColor(color) {
    const { r, g, b } = hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, 0)`;
  }

  function getSortedGradientStops() {
    return state.gradientStops
      .map((stop) => ({
        color: stop.color || "#000000",
        position: clamp(Number(stop.position) || 0, 0, 100),
      }))
      .sort((a, b) => a.position - b.position);
  }

  function gradientStopsCss() {
    return getSortedGradientStops()
      .map((stop) => `${stop.color} ${stop.position}%`)
      .join(", ");
  }

  function getCssBackground() {
    if (state.backgroundMode === "solid") {
      return {
        color: state.backgroundColor,
        image: "none",
        size: "auto",
      };
    }
    if (state.backgroundMode !== "gradient") {
      return {
        color: "transparent",
        image: "",
        size: "16px 16px",
      };
    }

    const stops = gradientStopsCss();
    const scale = `${state.gradientScale}% ${state.gradientScale}%`;
    if (state.gradientType === "linear") {
      return {
        color: state.backgroundColor,
        image: `linear-gradient(${state.gradientAngle}deg, ${stops})`,
        size: scale,
      };
    }
    if (state.gradientType === "free" && state.freeGradientPoints.length) {
      return {
        color: state.backgroundColor,
        image: state.freeGradientPoints
          .map((point) => {
            const fadeAt = clamp(state.gradientScale / 2, 15, 95);
            return `radial-gradient(circle at ${point.x * 100}% ${point.y * 100}%, ${point.color} 0%, ${point.color} ${fadeAt / 2}%, ${transparentColor(point.color)} ${fadeAt}%)`;
          })
          .join(", "),
        size: "100% 100%",
      };
    }
    const shape = state.gradientType === "circular" ? "circle" : "ellipse";
    return {
      color: state.backgroundColor,
      image: `radial-gradient(${shape} at center, ${stops})`,
      size: scale,
    };
  }

  function renderGradientStops() {
    els.gradientStopList.innerHTML = "";
    state.gradientStops.forEach((stop, index) => {
      const row = document.createElement("label");
      row.className = "gradient-stop";
      const color = document.createElement("input");
      color.type = "color";
      color.value = stop.color;
      color.addEventListener("input", (event) => {
        state.gradientStops[index].color = event.currentTarget.value;
        applyCompositionStyles();
      });
      const position = document.createElement("input");
      position.type = "number";
      position.min = "0";
      position.max = "100";
      position.step = "1";
      position.value = String(stop.position);
      position.addEventListener("input", (event) => {
        state.gradientStops[index].position = clamp(Number(event.currentTarget.value) || 0, 0, 100);
        applyCompositionStyles();
      });
      row.append(color, position);
      els.gradientStopList.append(row);
    });
  }

  function renderCompositionControls() {
    els.frameButtons.forEach((button) => {
      const key = button.dataset.frameRatio;
      const active = state.frameRatioKey === key;
      button.classList.toggle("active", active);
      button.textContent = active ? getRatioLabel(getFrameRatio()) : key;
    });
    els.backgroundButtons.forEach((button) => {
      const color = button.dataset.bgPreset;
      const active = button.hasAttribute("data-bg-transparent")
        ? state.backgroundMode === "transparent"
        : state.backgroundMode === "solid" && state.backgroundColor.toLowerCase() === color;
      button.classList.toggle("active", active);
    });
    els.backgroundColorInput.value = state.backgroundColor;
    els.gradientToggleButton.classList.toggle("active", state.backgroundMode === "gradient");
    els.gradientPanel.hidden = !state.gradientPanelOpen;
    els.gradientTypeInput.value = state.gradientType;
    els.gradientAngleInput.value = String(state.gradientAngle);
    els.gradientScaleInput.value = String(state.gradientScale);
    const selectedVisualClip = getSelectedVisualClip();
    els.mediaScaleInput.disabled = !selectedVisualClip;
    els.mediaScaleInput.value = String(selectedVisualClip ? selectedVisualClip.mediaScale : 1);
    if (els.gradientStopList.children.length !== state.gradientStops.length) {
      renderGradientStops();
    }
  }

  function applyCompositionStyles() {
    renderCompositionControls();
    const frameRect = els.viewerFrame.getBoundingClientRect();
    const maxWidth = Math.max(1, frameRect.width - 18);
    const maxHeight = Math.max(1, frameRect.height - 18);
    const ratio = getFrameRatio();
    if (ratio) {
      const aspect = ratio.width / ratio.height;
      let width = maxWidth;
      let height = width / aspect;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspect;
      }
      els.viewerStage.style.width = `${Math.max(1, width)}px`;
      els.viewerStage.style.height = `${Math.max(1, height)}px`;
    } else {
      els.viewerStage.style.width = "100%";
      els.viewerStage.style.height = "100%";
    }

    els.viewerStage.classList.toggle("transparent", state.backgroundMode === "transparent");
    const background = getCssBackground();
    if (state.backgroundMode === "transparent") {
      els.viewerStage.style.backgroundColor = "";
      els.viewerStage.style.backgroundImage = "";
      els.viewerStage.style.backgroundSize = "";
    } else {
      els.viewerStage.style.backgroundColor = background.color;
      els.viewerStage.style.backgroundImage = background.image;
      els.viewerStage.style.backgroundSize = background.size;
      els.viewerStage.style.backgroundPosition = "center";
    }
  }

  function addGradientStop() {
    const last = state.gradientStops[state.gradientStops.length - 1];
    const color = els.gradientColorInput.value || (last ? last.color : "#000000");
    state.gradientStops.push({
      color,
      position: clamp(state.gradientStops.length * 25, 0, 100),
    });
    state.backgroundMode = "gradient";
    applyCompositionStyles();
  }

  function removeGradientStop() {
    if (state.gradientStops.length > 2) {
      state.gradientStops.pop();
      applyCompositionStyles();
    }
  }

  function isFreeGradientEditing() {
    return state.backgroundMode === "gradient" &&
      state.gradientType === "free" &&
      state.gradientPanelOpen;
  }

  function addFreeGradientPoint(clientX, clientY) {
    const rect = els.viewerStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.freeGradientPoints.push({
      color: els.gradientColorInput.value || "#000000",
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1),
    });
    state.backgroundMode = "gradient";
    state.gradientType = "free";
    applyCompositionStyles();
  }

  function startMediaDrag(event) {
    const clip = getClip(event.currentTarget.dataset.clipId);
    if (!clip) return;
    event.preventDefault();
    event.stopPropagation();
    const wasSelected = state.selectedClipId === clip.id;
    setSelectedClip(clip.id, false);
    ensureClipTransform(clip);
    state.mediaDrag = {
      clipId: clip.id,
      moved: false,
      pointerId: event.pointerId,
      startOffsetX: clip.mediaOffsetX,
      startOffsetY: clip.mediaOffsetY,
      startX: event.clientX,
      startY: event.clientY,
      target: event.currentTarget,
      wasSelected,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePreview(false);
  }

  function moveMediaDrag(event) {
    if (!state.mediaDrag) return;
    const clip = ensureClipTransform(getClip(state.mediaDrag.clipId));
    if (!clip) return;
    const rect = els.viewerStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = event.clientX - state.mediaDrag.startX;
    const dy = event.clientY - state.mediaDrag.startY;
    if (Math.hypot(dx, dy) > 3) {
      state.mediaDrag.moved = true;
    }
    clip.mediaOffsetX = clamp(state.mediaDrag.startOffsetX + dx / rect.width, -2, 2);
    clip.mediaOffsetY = clamp(state.mediaDrag.startOffsetY + dy / rect.height, -2, 2);
    updatePreview(false);
  }

  function endMediaDrag(event) {
    if (!state.mediaDrag) return;
    const wasClick = !state.mediaDrag.moved;
    const wasSelected = state.mediaDrag.wasSelected;
    state.mediaDrag = null;
    if (wasClick && wasSelected) {
      clearSelectedClips();
      updatePreview(false);
    }
  }

  function snapTime(value) {
    if (!state.snap) return Math.max(0, value);
    const gridSeconds = getGridSeconds();
    return Math.max(0, Math.round(value / gridSeconds) * gridSeconds);
  }

  function getTimelineFps() {
    return clamp(Number(els.fpsInput.value) || 24, 1, 120);
  }

  function getGridSeconds() {
    return clamp(Number(state.gridSeconds) || 1, 0.05, 60);
  }

  function getImageDurationSeconds() {
    return Math.max(MIN_CLIP_DURATION, state.imageGridLength * getGridSeconds());
  }

  function updateImageAssetDurations() {
    const duration = getImageDurationSeconds();
    state.assets.forEach((asset) => {
      if (asset.type === "image") asset.duration = duration;
    });
  }

  function applyImageGridLengthToAll() {
    const duration = getImageDurationSeconds();
    updateImageAssetDurations();
    state.clips.forEach((clip) => {
      const asset = getAsset(clip.assetId);
      if (asset && asset.type === "image") {
        clip.duration = duration;
        clip.inPoint = 0;
      }
    });
    render();
  }

  function syncGridSecondsInput() {
    els.gridSecondsInput.value = formatDecimalInput(getGridSeconds());
  }

  function adjustGridSeconds(delta) {
    state.gridSeconds = clamp(getGridSeconds() + delta, 0.05, 60);
    syncGridSecondsInput();
    updateImageAssetDurations();
    render();
  }

  function formatTime(value) {
    const safe = Math.max(0, value || 0);
    const minutes = Math.floor(safe / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(safe % 60)
      .toString()
      .padStart(2, "0");
    const hundredths = Math.floor((safe % 1) * 100)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}.${hundredths}`;
  }

  function getAsset(assetId) {
    return state.assets.find((asset) => asset.id === assetId) || null;
  }

  function setSelectedAssets(assetIds) {
    const validIds = assetIds.filter((assetId) => getAsset(assetId));
    state.selectedAssetIds = Array.from(new Set(validIds));
    state.selectedAssetId = state.selectedAssetIds[0] || null;
  }

  function getSelectedAssets() {
    const selected = state.selectedAssetIds
      .map((assetId) => getAsset(assetId))
      .filter(Boolean);
    if (selected.length) return selected;
    const fallback = getAsset(state.selectedAssetId);
    return fallback ? [fallback] : [];
  }

  function toggleSelectedAsset(assetId) {
    if (!getAsset(assetId)) return;
    if (state.selectedAssetIds.includes(assetId)) {
      setSelectedAssets(state.selectedAssetIds.filter((selectedId) => selectedId !== assetId));
    } else {
      setSelectedAssets([...state.selectedAssetIds, assetId]);
    }
  }

  function getClip(clipId) {
    return state.clips.find((clip) => clip.id === clipId) || null;
  }

  function setSelectedClips(clipIds, primaryClipId) {
    const validIds = clipIds.filter((clipId) => getClip(clipId));
    state.selectedClipIds = Array.from(new Set(validIds));
    state.selectedClipId =
      primaryClipId && state.selectedClipIds.includes(primaryClipId)
        ? primaryClipId
        : state.selectedClipIds[state.selectedClipIds.length - 1] || null;
    const primaryClip = getClip(state.selectedClipId);
    if (primaryClip) {
      setSelectedAssets([primaryClip.assetId]);
    }
  }

  function clearSelectedClips() {
    state.selectedClipIds = [];
    state.selectedClipId = null;
  }

  function toggleSelectedClip(clipId) {
    if (!getClip(clipId)) return;
    if (state.selectedClipIds.includes(clipId)) {
      setSelectedClips(
        state.selectedClipIds.filter((selectedId) => selectedId !== clipId),
        state.selectedClipId === clipId ? null : state.selectedClipId,
      );
    } else {
      setSelectedClips([...state.selectedClipIds, clipId], clipId);
    }
  }

  function selectAllTimelineClips() {
    setSelectedClips(state.clips.map((clip) => clip.id));
  }

  function isVisualAsset(asset) {
    return asset && (asset.type === "image" || asset.type === "video");
  }

  function ensureClipTransform(clip) {
    if (!clip) return null;
    if (!Number.isFinite(Number(clip.mediaOffsetX))) clip.mediaOffsetX = 0;
    if (!Number.isFinite(Number(clip.mediaOffsetY))) clip.mediaOffsetY = 0;
    if (!Number.isFinite(Number(clip.mediaScale))) clip.mediaScale = 1;
    return clip;
  }

  function getSelectedVisualClip() {
    const clip = getClip(state.selectedClipId);
    const asset = clip ? getAsset(clip.assetId) : null;
    return isVisualAsset(asset) ? ensureClipTransform(clip) : null;
  }

  function getActiveVisualClipsAt(time) {
    return state.clips
      .filter((clip) => {
        const asset = getAsset(clip.assetId);
        return isVisualAsset(asset) &&
          time >= clip.start &&
          time < clip.start + clip.duration;
      })
      .sort((a, b) => getTrackIndex(b.trackId) - getTrackIndex(a.trackId))
      .map((clip) => ensureClipTransform(clip));
  }

  function setSelectedClip(clipId, forceSeek) {
    const clip = getClip(clipId);
    setSelectedClips(clip ? [clip.id] : [], clip ? clip.id : null);
    if (clip) {
      if (
        forceSeek &&
        (state.playhead < clip.start || state.playhead >= clip.start + clip.duration)
      ) {
        state.playhead = clip.start;
      }
    }
  }

  function getClipSourceDuration(clip) {
    const asset = getAsset(clip.assetId);
    if (
      asset &&
      (asset.type === "video" || asset.type === "audio") &&
      Number.isFinite(asset.duration) &&
      asset.duration > 0
    ) {
      return asset.duration;
    }
    return Infinity;
  }

  function getTrack(trackId) {
    return state.tracks.find((track) => track.id === trackId) || null;
  }

  function getTrackVolume(trackId) {
    const track = getTrack(trackId);
    return clamp(Number(track && track.volume) || 0, 0, 1);
  }

  function setTrackVolume(trackId, volume) {
    const track = getTrack(trackId);
    if (!track) return;
    track.volume = clamp(volume, 0, 1);
    updatePreviewAudio(true);
  }

  function assetHasAudio(asset) {
    return asset && (asset.type === "audio" || asset.type === "video");
  }

  function trackHasAudio(trackId) {
    return state.clips.some((clip) => {
      const asset = getAsset(clip.assetId);
      return clip.trackId === trackId && assetHasAudio(asset);
    });
  }

  function getTrackIndex(trackId) {
    return Math.max(
      0,
      state.tracks.findIndex((track) => track.id === trackId),
    );
  }

  function getPreferredClipDuration(asset) {
    if (!asset) return getImageDurationSeconds();
    if (asset.type === "image") return getImageDurationSeconds();
    return asset.duration && Number.isFinite(asset.duration)
      ? Math.max(MIN_CLIP_DURATION, asset.duration)
      : Math.max(2, getImageDurationSeconds());
  }

  function makeClip(asset, start, trackIndex) {
    ensureTrackIndex(trackIndex);
    return {
      assetId: asset.id,
      duration: getPreferredClipDuration(asset),
      id: createId("clip"),
      inPoint: 0,
      mediaOffsetX: 0,
      mediaOffsetY: 0,
      mediaScale: 1,
      name: asset.name,
      start: snapTime(start),
      trackId: state.tracks[trackIndex].id,
    };
  }

  function ensureTrackIndex(trackIndex) {
    while (state.tracks.length <= trackIndex) {
      state.tracks.push({
        id: createId("track"),
        name: `layer ${state.tracks.length + 1}`,
        volume: 1,
      });
    }
    if (!Number.isFinite(Number(state.tracks[trackIndex].volume))) {
      state.tracks[trackIndex].volume = 1;
    }
  }

  function cleanFileName(file) {
    return file.name.replace(/\.[^/.]+$/, "") || file.name;
  }

  function getFileType(file) {
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("audio/")) return "audio";
    return null;
  }

  async function addFiles(files) {
    const validFiles = Array.from(files).filter((file) => getFileType(file));
    if (!validFiles.length) return;

    const newAssets = validFiles.map((file) => {
      const type = getFileType(file);
      const url = URL.createObjectURL(file);
      const asset = {
        duration: type === "image" ? getImageDurationSeconds() : null,
        file,
        id: createId("asset"),
        name: cleanFileName(file),
        revokeUrl: true,
        size: file.size,
        type,
        url,
      };
      if (type === "video" || type === "audio") {
        loadMediaDuration(asset);
      }
      return asset;
    });

    state.assets.push(...newAssets);
    setSelectedAssets([newAssets[0].id]);
    render();
  }

  function loadMediaDuration(asset) {
    const probe = document.createElement(asset.type === "audio" ? "audio" : "video");
    probe.preload = "metadata";
    probe.src = asset.url;
    probe.addEventListener("loadedmetadata", () => {
      asset.duration =
        Number.isFinite(probe.duration) && probe.duration > 0
          ? probe.duration
          : Math.max(2, getImageDurationSeconds());
      render();
    });
    probe.addEventListener("error", () => {
      asset.duration = Math.max(2, getImageDurationSeconds());
      render();
    });
  }

  function render() {
    updateDurations();
    renderAssets();
    renderTimeline();
    updatePreview(false);
    updateReadouts();
    applyCompositionStyles();
  }

  function updateDurations() {
    const lastClipEnd = state.clips.reduce(
      (max, clip) => Math.max(max, clip.start + clip.duration),
      0,
    );
    if (state.renderEndAuto) {
      state.renderEnd = lastClipEnd;
    }
    state.renderEnd = Math.max(0, state.renderEnd);
    state.sequenceDuration = Math.max(12, lastClipEnd + 2, state.renderEnd + 2);
    state.playhead = clamp(state.playhead, 0, state.sequenceDuration);
    els.playheadRange.max = state.sequenceDuration.toFixed(2);
  }

  function renderAssets() {
    els.mediaStatus.textContent = `${state.assets.length} media / ${state.clips.length} clips`;
    els.assetList.innerHTML = "";

    if (!state.assets.length) {
      const empty = document.createElement("div");
      empty.className = "meta-panel";
      empty.innerHTML = "<div>no imported files</div><div>use + or drop files here</div>";
      els.assetList.append(empty);
      return;
    }

    state.assets.forEach((asset) => {
      const isSelected = state.selectedAssetIds.includes(asset.id);
      const card = document.createElement("button");
      card.className = `asset-card${isSelected ? " selected" : ""}`;
      card.draggable = true;
      card.type = "button";
      card.dataset.assetId = asset.id;

      const thumb = document.createElement("div");
      thumb.className = "asset-thumb";
      if (asset.type === "image") {
        const img = document.createElement("img");
        img.src = asset.url;
        img.alt = "";
        thumb.append(img);
      } else if (asset.type === "video") {
        const video = document.createElement("video");
        video.src = asset.url;
        video.muted = true;
        video.preload = "metadata";
        thumb.append(video);
      } else {
        const audioMark = document.createElement("div");
        audioMark.className = "asset-audio-mark";
        audioMark.textContent = "wave";
        thumb.append(audioMark);
      }

      const type = document.createElement("span");
      type.className = "asset-type";
      type.textContent = asset.type;
      thumb.append(type);

      const info = document.createElement("div");
      info.className = "asset-info";
      const name = document.createElement("div");
      name.className = "asset-name";
      name.textContent = asset.name;
      const meta = document.createElement("div");
      meta.className = "asset-meta";
      const duration =
        asset.duration === null ? "loading" : `${formatTime(asset.duration)}`;
      meta.textContent = `${duration} / ${Math.round(asset.size / 1024)}kb`;
      info.append(name, meta);

      card.append(thumb, info);
      card.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          toggleSelectedAsset(asset.id);
        } else {
          setSelectedAssets([asset.id]);
        }
        clearSelectedClips();
        render();
      });
      card.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", `asset:${asset.id}`);
        event.dataTransfer.effectAllowed = "copy";
      });
      els.assetList.append(card);
    });
  }

  function renderTimeline() {
    const trackCount = Math.max(DEFAULT_TRACK_COUNT, state.tracks.length);
    const contentWidth = Math.max(
      els.timelineScroll.clientWidth || 0,
      Math.ceil(state.sequenceDuration * state.zoom),
    );
    const contentHeight = Math.max(
      els.timelineScroll.clientHeight || 0,
      trackCount * TRACK_HEIGHT,
    );

    els.timelineContent.style.width = `${contentWidth}px`;
    els.timelineContent.style.height = `${contentHeight}px`;
    els.timelineGrid.style.backgroundSize = `${getGridSeconds() * state.zoom}px ${TRACK_HEIGHT}px`;
    els.timelineDropHint.classList.toggle("hidden", state.clips.length > 0);

    renderTrackLabels(trackCount, contentHeight);
    renderRuler(contentWidth);
    renderClips();
    updatePlayheadPosition();
  }

  function renderTrackLabels(trackCount, contentHeight) {
    els.trackLabels.innerHTML = "";
    els.trackLabels.style.height = `${contentHeight}px`;
    for (let index = 0; index < trackCount; index += 1) {
      ensureTrackIndex(index);
      const label = document.createElement("div");
      label.className = "track-label";
      label.style.height = `${TRACK_HEIGHT}px`;

      const badge = document.createElement("span");
      badge.className = "track-index";
      badge.textContent = String(index + 1).padStart(2, "0");

      const name = document.createElement("input");
      name.className = "track-name-input";
      name.value = state.tracks[index].name;
      name.title = "edit layer name";
      name.addEventListener("pointerdown", (event) => event.stopPropagation());
      name.addEventListener("click", (event) => {
        event.stopPropagation();
        event.currentTarget.select();
      });
      name.addEventListener("input", (event) => {
        state.tracks[index].name = event.currentTarget.value;
      });
      name.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.currentTarget.value = state.tracks[index].name;
          event.currentTarget.blur();
        }
      });
      name.addEventListener("blur", (event) => {
        const value = event.currentTarget.value.trim();
        state.tracks[index].name = value || `layer ${index + 1}`;
        event.currentTarget.value = state.tracks[index].name;
      });

      if (trackHasAudio(state.tracks[index].id)) {
        label.classList.add("audio-track");
        const volume = document.createElement("input");
        volume.className = "track-volume";
        volume.type = "range";
        volume.min = "0";
        volume.max = "1";
        volume.step = "0.01";
        volume.value = String(getTrackVolume(state.tracks[index].id));
        volume.title = "layer volume";
        volume.addEventListener("pointerdown", (event) => event.stopPropagation());
        volume.addEventListener("input", (event) => {
          setTrackVolume(state.tracks[index].id, Number(event.currentTarget.value));
        });
        label.append(badge, volume, name);
      } else {
        label.append(badge, name);
      }
      els.trackLabels.append(label);
    }
  }

  function renderRuler(contentWidth) {
    els.rulerContent.innerHTML = "";
    els.rulerContent.style.width = `${contentWidth}px`;
    const range = document.createElement("div");
    range.className = "render-range";
    range.id = "renderRange";
    range.style.width = `${Math.max(0, state.renderEnd * state.zoom)}px`;
    const fill = document.createElement("div");
    fill.className = "render-range-fill";
    const handle = document.createElement("div");
    handle.className = "render-range-handle";
    handle.id = "renderRangeHandle";
    handle.title = "render end";
    handle.addEventListener("pointerdown", startRenderEndDrag);
    range.append(fill, handle);
    els.rulerContent.append(range);
    const seconds = Math.ceil(contentWidth / state.zoom);
    const tickEvery = getGridSeconds();
    const totalTicks = Math.ceil(seconds / tickEvery);

    for (let index = 0; index <= totalTicks; index += 1) {
      const time = index * tickEvery;
      const x = time * state.zoom;
      const isMajor = tickEvery >= 1 || Math.abs(time - Math.round(time)) < 0.001;
      const tick = document.createElement("div");
      tick.className = `ruler-tick${isMajor ? "" : " minor"}`;
      tick.style.left = `${x}px`;
      els.rulerContent.append(tick);

      if (isMajor) {
        const label = document.createElement("div");
        label.className = "ruler-label";
        label.style.left = `${x}px`;
        label.textContent = `${Number.isInteger(time) ? Math.round(time) : time.toFixed(2)}s`;
        els.rulerContent.append(label);
      }
    }
  }

  function renderClips() {
    els.clipsLayer.innerHTML = "";
    state.clips.forEach((clip) => {
      const asset = getAsset(clip.assetId);
      const trackIndex = getTrackIndex(clip.trackId);
      const el = document.createElement("div");
      const isSelected = state.selectedClipIds.includes(clip.id);
      el.className = `timeline-clip${isSelected ? " selected" : ""}`;
      el.style.left = `${clip.start * state.zoom}px`;
      el.style.top = `${trackIndex * TRACK_HEIGHT}px`;
      el.style.width = `${Math.max(24, clip.duration * state.zoom)}px`;
      el.dataset.clipId = clip.id;

      const leftHandle = document.createElement("div");
      leftHandle.className = "trim-handle trim-left";
      leftHandle.dataset.trim = "left";
      leftHandle.title = "trim start";

      const body = document.createElement("div");
      body.className = "clip-body";
      const name = document.createElement("div");
      name.className = "clip-name";
      name.textContent = clip.name;
      const meta = document.createElement("div");
      meta.className = "clip-meta";
      const trimMeta =
        asset && asset.type === "video"
          ? ` / in ${formatTime(clip.inPoint)}`
          : "";
      meta.textContent = `${asset ? asset.type : "missing"} / ${formatTime(clip.duration)}${trimMeta}`;
      body.append(name, meta);

      const rightHandle = document.createElement("div");
      rightHandle.className = "trim-handle trim-right";
      rightHandle.dataset.trim = "right";
      rightHandle.title = "trim end";

      el.append(leftHandle, body, rightHandle);
      el.addEventListener("pointerdown", onClipPointerDown);
      els.clipsLayer.append(el);
    });
  }

  function updateReadouts() {
    els.timeReadout.textContent = `${formatTime(state.playhead)} / ${formatTime(state.sequenceDuration)}`;
    els.playheadRange.value = state.playhead.toFixed(2);
    els.timelineStatus.textContent = `${state.tracks.length} layers / ${state.clips.length} clips / render ${formatTime(getRenderDuration())}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updatePlayheadPosition() {
    els.playhead.style.left = `${state.playhead * state.zoom}px`;
  }

  function applyPreviewClipTransform(element, clip, zIndex) {
    ensureClipTransform(clip);
    const stageRect = els.viewerStage.getBoundingClientRect();
    const x = clip.mediaOffsetX * stageRect.width;
    const y = clip.mediaOffsetY * stageRect.height;
    element.style.transform = `translate(${x}px, ${y}px) scale(${clip.mediaScale})`;
    element.style.zIndex = String(zIndex);
    element.classList.toggle("selected", clip.id === state.selectedClipId);
  }

  function createPreviewVisualElement(asset, clip) {
    const element = document.createElement(asset.type === "video" ? "video" : "img");
    element.className = "preview-item";
    element.dataset.clipId = clip.id;
    if (asset.type === "video") {
      element.muted = true;
      element.playsInline = true;
      element.preload = "auto";
      element.src = asset.url;
    } else {
      element.src = asset.url;
      element.alt = "";
    }
    element.addEventListener("pointerdown", startMediaDrag);
    return element;
  }

  function updatePreview(forceSeek) {
    const activeVisualClips = getActiveVisualClipsAt(state.playhead);
    const activeVisualIds = new Set(activeVisualClips.map((clip) => clip.id));

    els.previewVideo.pause();
    els.previewVideo.classList.remove("visible");
    els.previewImage.classList.remove("visible");

    state.previewVisualItems.forEach((item, clipId) => {
      if (!activeVisualIds.has(clipId)) {
        if (item.tagName === "VIDEO") {
          item.pause();
          item.removeAttribute("src");
          item.load();
        }
        item.remove();
        state.previewVisualItems.delete(clipId);
      }
    });

    if (!activeVisualClips.length) {
      state.previewClipId = null;
      els.viewerPlaceholder.classList.remove("hidden");
      els.previewStatus.textContent = getActiveAudioClipsAt(state.playhead).length
        ? "audio at playhead"
        : "no clip at playhead";
      updatePlayheadPosition();
      updatePreviewAudio(forceSeek);
      renderCompositionControls();
      return;
    }

    els.viewerPlaceholder.classList.add("hidden");
    const selectedActiveClip = activeVisualClips.find((clip) => clip.id === state.selectedClipId);
    const statusClip = selectedActiveClip || activeVisualClips[activeVisualClips.length - 1];
    const statusAsset = getAsset(statusClip.assetId);
    const statusLocalTime = getClipLocalTime(statusClip, statusAsset.duration || statusClip.duration);
    state.previewClipId = statusClip.id;
    els.previewStatus.textContent = `${activeVisualClips.length} visual / ${statusAsset.name} / ${formatTime(statusLocalTime)}`;

    activeVisualClips.forEach((clip, index) => {
      const asset = getAsset(clip.assetId);
      if (!asset) return;
      let item = state.previewVisualItems.get(clip.id);
      if (!item || item.dataset.assetId !== asset.id || item.dataset.assetType !== asset.type) {
        if (item) item.remove();
        item = createPreviewVisualElement(asset, clip);
        item.dataset.assetId = asset.id;
        item.dataset.assetType = asset.type;
        state.previewVisualItems.set(clip.id, item);
      }
      els.previewVisualLayer.append(item);
      const zIndex = clip.id === state.selectedClipId ? activeVisualClips.length + 2 : index + 1;
      applyPreviewClipTransform(item, clip, zIndex);

      if (asset.type === "video") {
        const localTime = getClipLocalTime(clip, item.duration || asset.duration || clip.duration);
        if (
          forceSeek ||
          !Number.isFinite(item.currentTime) ||
          Math.abs(item.currentTime - localTime) > 0.16
        ) {
          try {
            item.currentTime = localTime;
          } catch (error) {
            // Some browsers reject seeks before metadata is available.
          }
        }
        if (state.playing) {
          item.play().catch(() => {});
        } else {
          item.pause();
        }
      }
    });

    updatePreviewAudio(forceSeek);
    updatePlayheadPosition();
    renderCompositionControls();
  }

  function getActiveClip() {
    const candidates = state.clips
      .filter(
        (clip) =>
          state.playhead >= clip.start &&
          state.playhead < clip.start + clip.duration,
      )
      .sort((a, b) => getTrackIndex(a.trackId) - getTrackIndex(b.trackId));
    return candidates[0] || null;
  }

  function getActiveVisualClip() {
    const candidates = getActiveVisualClipsAt(state.playhead)
      .slice()
      .sort((a, b) => getTrackIndex(a.trackId) - getTrackIndex(b.trackId));
    return candidates[0] || null;
  }

  function getActiveAudioClipsAt(time) {
    return state.clips.filter((clip) => {
      const asset = getAsset(clip.assetId);
      return assetHasAudio(asset) &&
        time >= clip.start &&
        time < clip.start + clip.duration;
    });
  }

  function getClipLocalTime(clip, mediaDuration) {
    return clamp(
      clip.inPoint + state.playhead - clip.start,
      0,
      Math.max(0, (mediaDuration || clip.duration) - 0.03),
    );
  }

  function createPreviewAudioPlayer(asset) {
    const player = document.createElement(asset.type === "audio" ? "audio" : "video");
    player.preload = "auto";
    player.playsInline = true;
    player.src = asset.url;
    player.muted = false;
    return player;
  }

  function updatePreviewAudio(forceSeek) {
    const visualClipId =
      state.previewClipId &&
      els.previewVideo.classList.contains("visible")
        ? state.previewClipId
        : null;
    const activeAudioClips = getActiveAudioClipsAt(state.playhead);
    const activeIds = new Set();

    activeAudioClips.forEach((clip) => {
      const asset = getAsset(clip.assetId);
      if (!asset) return;
      activeIds.add(clip.id);
      const volume = getTrackVolume(clip.trackId);

      if (clip.id === visualClipId && asset.type === "video") {
        els.previewVideo.muted = false;
        els.previewVideo.volume = volume;
        const duplicatePlayer = state.previewAudioPlayers.get(clip.id);
        if (duplicatePlayer) {
          duplicatePlayer.pause();
          duplicatePlayer.removeAttribute("src");
          duplicatePlayer.load();
          state.previewAudioPlayers.delete(clip.id);
        }
        return;
      }

      let player = state.previewAudioPlayers.get(clip.id);
      if (!player) {
        player = createPreviewAudioPlayer(asset);
        state.previewAudioPlayers.set(clip.id, player);
      }
      const localTime = getClipLocalTime(clip, player.duration || asset.duration || clip.duration);
      player.volume = volume;
      if (
        forceSeek ||
        !Number.isFinite(player.currentTime) ||
        Math.abs(player.currentTime - localTime) > 0.18
      ) {
        try {
          player.currentTime = localTime;
        } catch (error) {
          // Media may reject seeks before metadata is available.
        }
      }
      if (state.playing) {
        player.play().catch(() => {});
      } else {
        player.pause();
      }
    });

    state.previewAudioPlayers.forEach((player, clipId) => {
      if (!activeIds.has(clipId)) {
        player.pause();
        player.removeAttribute("src");
        player.load();
        state.previewAudioPlayers.delete(clipId);
      }
    });
  }

  function pausePreviewAudio() {
    state.previewAudioPlayers.forEach((player) => player.pause());
    els.previewAudio.pause();
  }

  function pausePreviewVisuals() {
    state.previewVisualItems.forEach((item) => {
      if (item.tagName === "VIDEO") item.pause();
    });
  }

  function play() {
    if (!state.clips.length) return;
    if (state.playhead >= state.sequenceDuration - 0.02) {
      state.playhead = 0;
    }
    state.playing = true;
    state.lastFrameTime = performance.now();
    els.playButton.textContent = "pause";
    requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    els.playButton.textContent = "play";
    els.previewVideo.pause();
    pausePreviewVisuals();
    pausePreviewAudio();
  }

  function tick(now) {
    if (!state.playing) return;
    const delta = Math.min(0.08, (now - state.lastFrameTime) / 1000);
    state.lastFrameTime = now;
    state.playhead += delta;
    if (state.playhead >= state.sequenceDuration) {
      state.playhead = state.sequenceDuration;
      pause();
    }
    updatePreview(false);
    updateReadouts();
    requestAnimationFrame(tick);
  }

  function setPlayhead(value, forceSeek) {
    state.playhead = clamp(value, 0, state.sequenceDuration);
    updatePreview(forceSeek);
    updateReadouts();
  }

  function setPlayheadFromClientX(clientX) {
    const rect = els.timelineContent.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, els.timelineContent.offsetWidth);
    setPlayhead(snapTime(x / state.zoom), true);
  }

  function addAssetToTimeline(asset, time, trackIndex) {
    const clip = makeClip(asset, time, trackIndex);
    state.clips.push(clip);
    setSelectedClips([clip.id], clip.id);
    const track = state.tracks[trackIndex];
    if (track && /^layer \d+$/.test(track.name)) {
      track.name = asset.name;
    }
    render();
  }

  function addAssetsToTimelineSequence(assets, time, trackIndex) {
    const validAssets = assets.filter(Boolean);
    if (!validAssets.length) return;
    pause();
    ensureTrackIndex(trackIndex);
    const track = state.tracks[trackIndex];
    if (track && /^layer \d+$/.test(track.name)) {
      track.name = validAssets[0].name;
    }
    let cursor = snapTime(time);
    const clips = validAssets.map((asset) => {
      const duration = getPreferredClipDuration(asset);
      const clip = {
        assetId: asset.id,
        duration,
        id: createId("clip"),
        inPoint: 0,
        mediaOffsetX: 0,
        mediaOffsetY: 0,
        mediaScale: 1,
        name: asset.name,
        start: cursor,
        trackId: state.tracks[trackIndex].id,
      };
      cursor += duration;
      return clip;
    });
    state.clips.push(...clips);
    setSelectedClips(clips.map((clip) => clip.id), clips[clips.length - 1].id);
    setSelectedAssets(validAssets.map((asset) => asset.id));
    state.playhead = clips[0].start;
    render();
  }

  function sequenceLayers() {
    if (!state.assets.length) return;
    pause();
    state.clips = [];
    state.tracks = state.assets.map((asset, index) => ({
      id: createId("track"),
      name: asset.name || `layer ${index + 1}`,
      volume: 1,
    }));
    let cursor = 0;
    state.assets.forEach((asset, index) => {
      const duration = getPreferredClipDuration(asset);
      state.clips.push({
        assetId: asset.id,
        duration,
        id: createId("clip"),
        inPoint: 0,
        mediaOffsetX: 0,
        mediaOffsetY: 0,
        mediaScale: 1,
        name: asset.name,
        start: cursor,
        trackId: state.tracks[index].id,
      });
      cursor += duration;
    });
    setSelectedClips(state.clips[0] ? [state.clips[0].id] : [], state.clips[0] ? state.clips[0].id : null);
    state.playhead = 0;
    render();
  }

  function stackAtPlayhead() {
    if (!state.assets.length) return;
    pause();
    const firstNewTrack = state.tracks.length;
    state.assets.forEach((asset, index) => {
      ensureTrackIndex(firstNewTrack + index);
      state.tracks[firstNewTrack + index].name = asset.name;
      state.clips.push({
        assetId: asset.id,
        duration: getPreferredClipDuration(asset),
        id: createId("clip"),
        inPoint: 0,
        mediaOffsetX: 0,
        mediaOffsetY: 0,
        mediaScale: 1,
        name: asset.name,
        start: state.playhead,
        trackId: state.tracks[firstNewTrack + index].id,
      });
    });
    setSelectedClips(
      state.clips.length ? [state.clips[state.clips.length - 1].id] : [],
      state.clips.length ? state.clips[state.clips.length - 1].id : null,
    );
    render();
  }

  function addSelectedAsset() {
    const selectedAssets = getSelectedAssets();
    const assets = selectedAssets.length ? selectedAssets : state.assets.slice(0, 1);
    if (!assets.length) return;
    const trackIndex = findFirstOpenTrackAt(state.playhead);
    if (assets.length === 1) {
      addAssetToTimeline(assets[0], state.playhead, trackIndex);
    } else {
      addAssetsToTimelineSequence(assets, state.playhead, trackIndex);
    }
  }

  function findFirstOpenTrackAt(time) {
    for (let index = 0; index < state.tracks.length; index += 1) {
      const track = state.tracks[index];
      const busy = state.clips.some(
        (clip) =>
          clip.trackId === track.id &&
          time >= clip.start &&
          time < clip.start + clip.duration,
      );
      if (!busy) return index;
    }
    return state.tracks.length;
  }

  function splitSelectedOrActiveClip() {
    const clip = getClip(state.selectedClipId) || getActiveClip();
    if (!clip) return;
    if (
      state.playhead <= clip.start + MIN_CLIP_DURATION ||
      state.playhead >= clip.start + clip.duration - MIN_CLIP_DURATION
    ) {
      return;
    }
    const rightDuration = clip.start + clip.duration - state.playhead;
    const leftDuration = state.playhead - clip.start;
    const right = {
      ...clip,
      duration: rightDuration,
      id: createId("clip"),
      inPoint: clip.inPoint + leftDuration,
      start: state.playhead,
    };
    clip.duration = leftDuration;
    state.clips.push(right);
    setSelectedClips([right.id], right.id);
    render();
  }

  function duplicateSelectedClip() {
    const clip = getClip(state.selectedClipId);
    if (!clip) return;
    const copy = {
      ...clip,
      id: createId("clip"),
      start: snapTime(clip.start + clip.duration),
    };
    state.clips.push(copy);
    setSelectedClips([copy.id], copy.id);
    render();
  }

  function fitTimeline() {
    const width = Math.max(280, els.timelineScroll.clientWidth - 20);
    const duration = Math.max(1, state.sequenceDuration);
    state.zoom = clamp(Math.floor(width / duration), 38, 160);
    els.zoomInput.value = String(state.zoom);
    render();
  }

  function clearTimeline() {
    pause();
    state.clips = [];
    state.tracks = createDefaultTracks();
    clearSelectedClips();
    state.playhead = 0;
    state.renderEnd = 0;
    state.renderEndAuto = true;
    els.outputLengthInput.value = "";
    render();
  }

  function exportPlan() {
    const data = {
      app: "sequence player",
      exportedAt: new Date().toISOString(),
      composition: {
        backgroundColor: state.backgroundColor,
        backgroundMode: state.backgroundMode,
        frameRatio: getFrameRatio() ? getRatioLabel(getFrameRatio()) : "auto",
        gradientAngle: state.gradientAngle,
        gradientScale: state.gradientScale,
        gradientStops: state.gradientStops,
        gradientType: state.gradientType,
      },
      includeAudio: els.includeAudioInput.checked,
      gridSeconds: getGridSeconds(),
      imageGridLength: state.imageGridLength,
      media: state.assets.map((asset) => ({
        duration: asset.duration,
        name: asset.name,
        size: asset.size,
        type: asset.type,
      })),
      tracks: state.tracks.map((track, index) => ({
        layer: index + 1,
        name: track.name,
        volume: getTrackVolume(track.id),
      })),
      sequenceDuration: state.sequenceDuration,
      clips: state.clips.map((clip) => {
        const asset = getAsset(clip.assetId);
        return {
          assetName: asset ? asset.name : null,
          assetType: asset ? asset.type : null,
          duration: clip.duration,
          inPoint: clip.inPoint,
          layer: getTrackIndex(clip.trackId) + 1,
          mediaOffsetX: ensureClipTransform(clip).mediaOffsetX,
          mediaOffsetY: ensureClipTransform(clip).mediaOffsetY,
          mediaScale: ensureClipTransform(clip).mediaScale,
          name: clip.name,
          start: clip.start,
        };
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sequence-player-plan.json";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function getOutputDuration() {
    return getRenderDuration();
  }

  function getRenderDuration() {
    const clipEnd = state.clips.reduce(
      (max, clip) => Math.max(max, clip.start + clip.duration),
      0,
    );
    if (state.renderEnd > 0) return state.renderEnd;
    return clipEnd;
  }

  function getRecorderMimeType() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return "";
    const selected = EXPORT_FORMATS[state.exportFormat] || EXPORT_FORMATS.mp4;
    const candidates = selected.mimeCandidates || [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  function setRenderStatus(text) {
    els.renderStatus.textContent = text;
  }

  function setExportBusy(isBusy) {
    state.rendering = isBusy;
    els.exportButton.disabled = isBusy;
    els.exportButton.textContent = isBusy ? "rendering" : "export";
  }

  function waitForEventOnce(target, eventName) {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        target.removeEventListener(eventName, handleEvent);
        target.removeEventListener("error", handleError);
      };
      const handleEvent = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error(`media ${eventName} failed`));
      };
      target.addEventListener(eventName, handleEvent, { once: true });
      target.addEventListener("error", handleError, { once: true });
    });
  }

  function loadRenderImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image load failed"));
      image.src = url;
    });
  }

  async function loadRenderVideo(url) {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = false;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    if (video.readyState < 1) {
      await waitForEventOnce(video, "loadedmetadata");
    }
    return video;
  }

  async function loadRenderAudio(url) {
    const audio = document.createElement("audio");
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.src = url;
    if (audio.readyState < 1) {
      await waitForEventOnce(audio, "loadedmetadata");
    }
    return audio;
  }

  async function prepareRenderSources() {
    const imageCache = new Map();
    const sources = new Map();
    for (const clip of state.clips) {
      const asset = getAsset(clip.assetId);
      if (!asset) continue;
      if (asset.type === "image") {
        if (!imageCache.has(asset.id)) {
          imageCache.set(asset.id, await loadRenderImage(asset.url));
        }
        sources.set(clip.id, {
          element: imageCache.get(asset.id),
          type: "image",
        });
      } else if (asset.type === "video") {
        sources.set(clip.id, {
          element: await loadRenderVideo(asset.url),
          type: "video",
        });
      } else if (asset.type === "audio") {
        sources.set(clip.id, {
          element: await loadRenderAudio(asset.url),
          type: "audio",
        });
      }
    }
    return sources;
  }

  async function setupExportAudio(sources) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    const audioSources = Array.from(sources.values()).filter((source) =>
      source.type === "video" || source.type === "audio"
    );
    if (!audioSources.length) return null;
    const context = new AudioContextClass();
    const destination = context.createMediaStreamDestination();
    audioSources.forEach((source) => {
      try {
        const node = context.createMediaElementSource(source.element);
        const gain = context.createGain();
        gain.gain.value = 0;
        node.connect(gain);
        gain.connect(destination);
        source.audioGain = gain;
      } catch (error) {
        source.audioGain = null;
      }
    });
    if (context.state === "suspended") {
      await context.resume();
    }
    return { context, destination };
  }

  function getActiveClipsAt(time) {
    return state.clips
      .filter((clip) => time >= clip.start && time < clip.start + clip.duration)
      .sort((a, b) => getTrackIndex(b.trackId) - getTrackIndex(a.trackId));
  }

  function getOutputHeight(width) {
    const aspect = getOutputAspect();
    return Math.max(1, Math.round(width * aspect.height / aspect.width));
  }

  function addCanvasGradientStops(gradient) {
    getSortedGradientStops().forEach((stop) => {
      gradient.addColorStop(stop.position / 100, stop.color);
    });
  }

  function drawFrameBackground(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    if (state.backgroundMode === "transparent") return;
    if (state.backgroundMode === "solid") {
      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    if (state.gradientType === "free" && state.freeGradientPoints.length) {
      ctx.fillStyle = state.backgroundColor;
      ctx.fillRect(0, 0, width, height);
      const radius = Math.max(width, height) * clamp(state.gradientScale / 100, 0.2, 3);
      state.freeGradientPoints.forEach((point) => {
        const x = point.x * width;
        const y = point.y * height;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius / 2);
        gradient.addColorStop(0, point.color);
        gradient.addColorStop(1, transparentColor(point.color));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      });
      return;
    }
    if (state.gradientType === "linear") {
      const angle = ((state.gradientAngle - 90) * Math.PI) / 180;
      const length = Math.hypot(width, height) * clamp(state.gradientScale / 100, 0.2, 3);
      const cx = width / 2;
      const cy = height / 2;
      const dx = Math.cos(angle) * length / 2;
      const dy = Math.sin(angle) * length / 2;
      const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
      addCanvasGradientStops(gradient);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      return;
    }
    const radiusBase = state.gradientType === "circular"
      ? Math.min(width, height) / 2
      : Math.max(width, height) / 2;
    const radius = radiusBase * clamp(state.gradientScale / 100, 0.2, 3);
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius);
    addCanvasGradientStops(gradient);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawContain(ctx, media, width, height, clip) {
    ensureClipTransform(clip);
    const sourceWidth = media.videoWidth || media.naturalWidth || width;
    const sourceHeight = media.videoHeight || media.naturalHeight || height;
    const scale = Math.min(width / sourceWidth, height / sourceHeight) * clip.mediaScale;
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const x = (width - drawWidth) / 2 + clip.mediaOffsetX * width;
    const y = (height - drawHeight) / 2 + clip.mediaOffsetY * height;
    ctx.drawImage(media, x, y, drawWidth, drawHeight);
  }

  function drawExportFrame(ctx, width, height, time, sources, activeMedia) {
    drawFrameBackground(ctx, width, height);

    const currentMedia = new Set();
    const activeClips = getActiveClipsAt(time);
    for (const clip of activeClips) {
      const source = sources.get(clip.id);
      if (!source) continue;
      if (source.type === "video" || source.type === "audio") {
        const media = source.element;
        const localTime = clamp(
          clip.inPoint + time - clip.start,
          0,
          Math.max(0, (media.duration || clip.duration) - 0.03),
        );
        currentMedia.add(clip.id);
        if (source.audioGain) {
          source.audioGain.gain.value = getTrackVolume(clip.trackId);
        }
        media.volume = getTrackVolume(clip.trackId);
        if (!activeMedia.has(clip.id)) {
          try {
            media.currentTime = localTime;
          } catch (error) {
            // Some browsers reject early seeks before enough media is buffered.
          }
          media.play().catch(() => {});
        } else if (Math.abs(media.currentTime - localTime) > 0.35) {
          try {
            media.currentTime = localTime;
          } catch (error) {
            // Keep recording with the closest decoded frame.
          }
        }
        if (source.type === "video" && media.readyState >= 2) {
          drawContain(ctx, media, width, height, clip);
        }
      } else if (source.type === "image") {
        drawContain(ctx, source.element, width, height, clip);
      }
    }

    for (const clipId of activeMedia) {
      if (!currentMedia.has(clipId)) {
        const source = sources.get(clipId);
        if (source && (source.type === "video" || source.type === "audio")) {
          source.element.pause();
          if (source.audioGain) {
            source.audioGain.gain.value = 0;
          }
        }
      }
    }

    return currentMedia;
  }

  function nextAnimationFrame() {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setExportPanelOpen(open) {
    state.exportPanelOpen = open;
    els.exportOptionsPanel.hidden = !open;
    els.exportPanelToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setExportFormat(format) {
    if (!EXPORT_FORMATS[format]) return;
    state.exportFormat = format;
    state.exportConfigured = true;
    els.exportFormatLabel.textContent = EXPORT_FORMATS[format].label;
    els.formatButtons.forEach((button) => {
      button.classList.toggle("selected", button.dataset.format === format);
    });
    setRenderStatus(`format ready / ${EXPORT_FORMATS[format].label}`);
  }

  function getOutputLengthValue() {
    const value = Number(els.outputLengthInput.value);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function applyOutputLength(value) {
    if (value === null) {
      state.renderEndAuto = true;
    } else {
      state.renderEndAuto = false;
      state.renderEnd = snapTime(value);
      els.outputLengthInput.value = String(Number(state.renderEnd.toFixed(2)));
    }
    render();
  }

  function setRenderEndFromClientX(clientX) {
    const rect = els.rulerContent.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, els.rulerContent.offsetWidth);
    state.renderEndAuto = false;
    state.renderEnd = snapTime(x / state.zoom);
    els.outputLengthInput.value = String(Number(state.renderEnd.toFixed(2)));
    updateDurations();
    updatePlayheadPosition();
    updateReadouts();
    const range = document.getElementById("renderRange");
    if (range) {
      range.style.width = `${Math.max(0, state.renderEnd * state.zoom)}px`;
    }
  }

  function startRenderEndDrag(event) {
    event.preventDefault();
    event.stopPropagation();
    pause();
    state.renderEndDragging = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setRenderEndFromClientX(event.clientX);
  }

  async function exportRenderedVideo() {
    if (state.rendering) return;
    if (!state.exportConfigured) {
      setExportPanelOpen(true);
      setRenderStatus("choose export format");
      return;
    }
    if (!state.clips.length) {
      setRenderStatus("export blocked / timeline empty");
      return;
    }
    const selectedFormat = EXPORT_FORMATS[state.exportFormat] || EXPORT_FORMATS.mp4;
    if (selectedFormat.nativeOnly) {
      setRenderStatus(`${selectedFormat.label} needs native ffmpeg`);
      return;
    }
    if (selectedFormat.zipFrames) {
      setRenderStatus(`${selectedFormat.label} queued / native zip pass next`);
      return;
    }
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
      setRenderStatus("export blocked / browser recorder missing");
      return;
    }

    pause();
    setExportBusy(true);
    setRenderStatus("preparing media");

    const outputDuration = getOutputDuration();
    const fps = clamp(Number(els.fpsInput.value) || 24, 12, 60);
    const width = clamp(Number(els.outputWidthInput.value) || 1280, 320, 1920);
    const height = getOutputHeight(width);
    const mimeType = getRecorderMimeType();
    if (!mimeType) {
      setRenderStatus(`${selectedFormat.label} unsupported in browser`);
      setExportBusy(false);
      return;
    }
    const chunks = [];
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: state.backgroundMode === "transparent" });
    const canvasStream = canvas.captureStream(fps);
    let stream = canvasStream;

    let sources = null;
    let exportAudio = null;
    try {
      sources = await prepareRenderSources();
      exportAudio = els.includeAudioInput.checked ? await setupExportAudio(sources) : null;
      if (exportAudio) {
        stream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...exportAudio.destination.stream.getAudioTracks(),
        ]);
      }
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      const stopped = new Promise((resolve) => {
        recorder.addEventListener("stop", resolve, { once: true });
      });
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size) chunks.push(event.data);
      });
      recorder.start(250);

      const activeMedia = new Set();
      const startedAt = performance.now();
      let elapsed = 0;
      while (elapsed < outputDuration) {
        elapsed = Math.min(outputDuration, (performance.now() - startedAt) / 1000);
        const currentMedia = drawExportFrame(
          ctx,
          width,
          height,
          elapsed,
          sources,
          activeMedia,
        );
        activeMedia.clear();
        currentMedia.forEach((clipId) => activeMedia.add(clipId));
        setRenderStatus(
          `rendering ${Math.round((elapsed / outputDuration) * 100)}% / ${formatTime(elapsed)}`,
        );
        await nextAnimationFrame();
      }

      drawExportFrame(ctx, width, height, outputDuration - 0.001, sources, activeMedia);
      recorder.stop();
      await stopped;
      const blob = new Blob(chunks, { type: mimeType });
      downloadBlob(blob, `sequence-player-export.${selectedFormat.extension}`);
      setRenderStatus(`export complete / ${Math.round(blob.size / 1024)}kb`);
    } catch (error) {
      setRenderStatus(`export failed / ${error.message || "unknown error"}`);
    } finally {
      if (sources) {
        sources.forEach((source) => {
          if (source.type === "video" || source.type === "audio") {
            source.element.pause();
            source.element.removeAttribute("src");
            source.element.load();
          }
        });
      }
      stream.getTracks().forEach((track) => track.stop());
      canvasStream.getTracks().forEach((track) => track.stop());
      if (exportAudio) {
        exportAudio.destination.stream.getTracks().forEach((track) => track.stop());
        exportAudio.context.close().catch(() => {});
      }
      setExportBusy(false);
      updatePreview(true);
    }
  }

  function handleTimelineDrop(event) {
    event.preventDefault();
    els.timelineScroll.classList.remove("drag-active");
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload.startsWith("asset:")) return;
    const asset = getAsset(payload.slice("asset:".length));
    if (!asset) return;
    const point = getTimelinePoint(event.clientX, event.clientY);
    const assets =
      state.selectedAssetIds.includes(asset.id) && state.selectedAssetIds.length > 1
        ? getSelectedAssets()
        : [asset];
    if (assets.length === 1) {
      addAssetToTimeline(asset, point.time, point.trackIndex);
    } else {
      addAssetsToTimelineSequence(assets, point.time, point.trackIndex);
    }
  }

  function getTimelinePoint(clientX, clientY) {
    const rect = els.timelineContent.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, els.timelineContent.offsetWidth);
    const y = clamp(clientY - rect.top, 0, els.timelineContent.offsetHeight);
    return {
      time: snapTime(x / state.zoom),
      trackIndex: Math.floor(y / TRACK_HEIGHT),
    };
  }

  function getTimelineLocalPoint(clientX, clientY) {
    const rect = els.timelineContent.getBoundingClientRect();
    return {
      x: clamp(clientX - rect.left, 0, els.timelineContent.offsetWidth),
      y: clamp(clientY - rect.top, 0, els.timelineContent.offsetHeight),
    };
  }

  function getSelectionRect(selection) {
    const left = Math.min(selection.startX, selection.currentX);
    const top = Math.min(selection.startY, selection.currentY);
    const right = Math.max(selection.startX, selection.currentX);
    const bottom = Math.max(selection.startY, selection.currentY);
    return {
      bottom,
      height: bottom - top,
      left,
      right,
      top,
      width: right - left,
    };
  }

  function rectsIntersect(a, b) {
    return a.left < b.right &&
      a.right > b.left &&
      a.top < b.bottom &&
      a.bottom > b.top;
  }

  function getClipRect(clip) {
    const trackIndex = getTrackIndex(clip.trackId);
    const left = clip.start * state.zoom;
    const top = trackIndex * TRACK_HEIGHT;
    return {
      bottom: top + TRACK_HEIGHT,
      left,
      right: left + Math.max(24, clip.duration * state.zoom),
      top,
    };
  }

  function updateTimelineSelectionBox() {
    let box = document.getElementById("timelineSelectionBox");
    if (!state.selectionDrag || !state.selectionDrag.started) {
      if (box) box.remove();
      return;
    }
    if (!box) {
      box = document.createElement("div");
      box.className = "timeline-selection-box";
      box.id = "timelineSelectionBox";
      els.timelineContent.append(box);
    }
    const rect = getSelectionRect(state.selectionDrag);
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;
  }

  function updateMarqueeSelection() {
    if (!state.selectionDrag) return;
    const rect = getSelectionRect(state.selectionDrag);
    const hitIds = state.clips
      .filter((clip) => rectsIntersect(rect, getClipRect(clip)))
      .map((clip) => clip.id);
    const selectedIds = state.selectionDrag.additive
      ? [...state.selectionDrag.originalSelectedIds, ...hitIds]
      : hitIds;
    setSelectedClips(selectedIds, selectedIds[selectedIds.length - 1] || null);
    renderClips();
    updatePreview(false);
  }

  function startTimelineSelectionDrag(event) {
    event.preventDefault();
    const point = getTimelineLocalPoint(event.clientX, event.clientY);
    state.selectionDrag = {
      additive: event.ctrlKey || event.metaKey,
      currentX: point.x,
      currentY: point.y,
      originalSelectedIds: state.selectedClipIds.slice(),
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      started: false,
    };
    els.timelineContent.setPointerCapture(event.pointerId);
  }

  function moveTimelineSelectionDrag(event) {
    const selection = state.selectionDrag;
    if (!selection) return;
    const point = getTimelineLocalPoint(event.clientX, event.clientY);
    selection.currentX = point.x;
    selection.currentY = point.y;
    if (Math.hypot(selection.currentX - selection.startX, selection.currentY - selection.startY) > 4) {
      selection.started = true;
    }
    updateTimelineSelectionBox();
    if (selection.started) {
      updateMarqueeSelection();
    }
  }

  function endTimelineSelectionDrag(event) {
    const selection = state.selectionDrag;
    if (!selection) return;
    state.selectionDrag = null;
    updateTimelineSelectionBox();
    if (!selection.started) {
      const point = getTimelinePoint(event.clientX, event.clientY);
      setPlayhead(point.time, true);
      if (!selection.additive) {
        clearSelectedClips();
      }
    }
    render();
  }

  function onClipPointerDown(event) {
    const clipEl = event.currentTarget;
    const clip = getClip(clipEl.dataset.clipId);
    if (!clip) return;
    event.preventDefault();
    event.stopPropagation();
    const trimSide = event.target.dataset.trim || null;
    if ((event.ctrlKey || event.metaKey) && !trimSide) {
      toggleSelectedClip(clip.id);
      render();
      return;
    }
    clipEl.setPointerCapture(event.pointerId);

    const wasSelected = state.selectedClipIds.includes(clip.id);
    const wasSingleSelected = wasSelected && state.selectedClipIds.length === 1;
    if (wasSelected) {
      setSelectedClips(state.selectedClipIds, clip.id);
    } else {
      setSelectedClip(clip.id, true);
    }
    const selectedOriginals = !trimSide && state.selectedClipIds.includes(clip.id)
      ? state.selectedClipIds
        .map((clipId) => {
          const selectedClip = getClip(clipId);
          return selectedClip
            ? {
              clipId,
              originalStart: selectedClip.start,
              originalTrackIndex: getTrackIndex(selectedClip.trackId),
            }
            : null;
        })
        .filter(Boolean)
      : [];
    state.drag = {
      clipId: clip.id,
      moved: false,
      originalDuration: clip.duration,
      originalInPoint: clip.inPoint,
      originalStart: clip.start,
      originalTrackIndex: getTrackIndex(clip.trackId),
      pointerId: event.pointerId,
      selectedOriginals,
      startX: event.clientX,
      startY: event.clientY,
      type: trimSide ? "trim" : "move",
      trimSide,
      wasSingleSelected,
    };

    render();
  }

  function moveDrag(event) {
    if (state.renderEndDragging) {
      setRenderEndFromClientX(event.clientX);
      return;
    }
    if (state.playheadDragging) {
      setPlayheadFromClientX(event.clientX);
      return;
    }
    if (state.mediaDrag) {
      moveMediaDrag(event);
      return;
    }
    if (state.selectionDrag) {
      moveTimelineSelectionDrag(event);
      return;
    }
    if (!state.drag) return;
    const clip = getClip(state.drag.clipId);
    if (!clip) return;

    const deltaTime = (event.clientX - state.drag.startX) / state.zoom;
    if (
      Math.hypot(event.clientX - state.drag.startX, event.clientY - state.drag.startY) > 3
    ) {
      state.drag.moved = true;
    }
    if (state.drag.type === "move") {
      const deltaRows = Math.round((event.clientY - state.drag.startY) / TRACK_HEIGHT);
      if (state.drag.selectedOriginals && state.drag.selectedOriginals.length > 1) {
        state.drag.selectedOriginals.forEach((original) => {
          const selectedClip = getClip(original.clipId);
          if (!selectedClip) return;
          const trackIndex = Math.max(0, original.originalTrackIndex + deltaRows);
          ensureTrackIndex(trackIndex);
          selectedClip.start = snapTime(original.originalStart + deltaTime);
          selectedClip.trackId = state.tracks[trackIndex].id;
        });
      } else {
        const trackIndex = Math.max(0, state.drag.originalTrackIndex + deltaRows);
        ensureTrackIndex(trackIndex);
        clip.start = snapTime(state.drag.originalStart + deltaTime);
        clip.trackId = state.tracks[trackIndex].id;
      }
    } else if (state.drag.trimSide === "left") {
      const snappedDelta = snapTime(state.drag.originalStart + deltaTime) - state.drag.originalStart;
      const maxDelta = state.drag.originalDuration - MIN_CLIP_DURATION;
      const sourceStartLimit = Number.isFinite(getClipSourceDuration(clip))
        ? -state.drag.originalInPoint
        : -Infinity;
      const delta = clamp(
        snappedDelta,
        Math.max(-state.drag.originalStart, sourceStartLimit),
        maxDelta,
      );
      clip.start = state.drag.originalStart + delta;
      clip.duration = state.drag.originalDuration - delta;
      clip.inPoint = Math.max(0, state.drag.originalInPoint + delta);
    } else {
      const gridSeconds = getGridSeconds();
      const duration = state.snap
        ? Math.round((state.drag.originalDuration + deltaTime) / gridSeconds) * gridSeconds
        : state.drag.originalDuration + deltaTime;
      const sourceDuration = getClipSourceDuration(clip);
      const maxDuration = Number.isFinite(sourceDuration)
        ? Math.max(MIN_CLIP_DURATION, sourceDuration - clip.inPoint)
        : Infinity;
      clip.duration = clamp(duration, MIN_CLIP_DURATION, maxDuration);
    }

    renderTimeline();
    updatePreview(true);
    updateReadouts();
  }

  function endDrag(event) {
    if (state.renderEndDragging) {
      state.renderEndDragging = false;
      render();
      return;
    }
    if (state.playheadDragging) {
      state.playheadDragging = false;
      render();
      return;
    }
    if (state.mediaDrag) {
      endMediaDrag(event);
      return;
    }
    if (state.selectionDrag) {
      endTimelineSelectionDrag(event);
      return;
    }
    if (!state.drag) return;
    const drag = state.drag;
    state.drag = null;
    if (!drag.moved && drag.wasSingleSelected && !drag.trimSide) {
      clearSelectedClips();
    }
    render();
  }

  function startPlayheadDrag(event) {
    event.preventDefault();
    event.stopPropagation();
    pause();
    state.playheadDragging = true;
    els.playhead.setPointerCapture(event.pointerId);
    setPlayheadFromClientX(event.clientX);
  }

  function handleAction(action) {
    const actions = {
      addSelected: addSelectedAsset,
      clearTimeline,
      duplicate: duplicateSelectedClip,
      fit: fitTimeline,
      sequence: sequenceLayers,
      split: splitSelectedOrActiveClip,
      stack: stackAtPlayhead,
    };
    if (actions[action]) actions[action]();
  }

  function deleteSelectedClip() {
    const selectedIds = state.selectedClipIds.length
      ? state.selectedClipIds
      : state.selectedClipId ? [state.selectedClipId] : [];
    if (!selectedIds.length) return;
    const removeIds = new Set(selectedIds);
    state.clips = state.clips.filter((clip) => !removeIds.has(clip.id));
    clearSelectedClips();
    render();
  }

  function syncScroll() {
    els.trackLabels.scrollTop = els.timelineScroll.scrollTop;
    els.timelineRuler.scrollLeft = els.timelineScroll.scrollLeft;
    els.rulerContent.style.transform = `translateX(${-els.timelineScroll.scrollLeft}px)`;
  }

  function attachEvents() {
    const actionGrid = document.querySelector(".action-grid");

    els.importButton.addEventListener("click", () => els.fileInput.click());
    els.fileInput.addEventListener("change", (event) => {
      addFiles(event.target.files);
      event.target.value = "";
    });

    els.clearMediaButton.addEventListener("click", () => {
      pause();
      state.assets.forEach((asset) => {
        if (asset.revokeUrl) URL.revokeObjectURL(asset.url);
      });
      state.assets = [];
      state.clips = [];
      state.tracks = createDefaultTracks();
      setSelectedAssets([]);
      clearSelectedClips();
      state.playhead = 0;
      state.renderEnd = 0;
      state.renderEndAuto = true;
      els.outputLengthInput.value = "";
      render();
    });
    els.selectAllMediaButton.addEventListener("click", () => {
      setSelectedAssets(state.assets.map((asset) => asset.id));
      clearSelectedClips();
      render();
    });
    ["dragenter", "dragover"].forEach((type) => {
      els.dropZone.addEventListener(type, (event) => {
        event.preventDefault();
        els.dropZone.classList.add("drag-active");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      els.dropZone.addEventListener(type, () => {
        els.dropZone.classList.remove("drag-active");
      });
    });
    els.dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      addFiles(event.dataTransfer.files);
    });

    els.timelineScroll.addEventListener("dragover", (event) => {
      event.preventDefault();
      els.timelineScroll.classList.add("drag-active");
    });
    els.timelineScroll.addEventListener("dragleave", () => {
      els.timelineScroll.classList.remove("drag-active");
    });
    els.timelineScroll.addEventListener("drop", handleTimelineDrop);
    els.timelineScroll.addEventListener("scroll", syncScroll);

    els.timelineContent.addEventListener("pointerdown", (event) => {
      const isTimelineBlank =
        event.target === els.timelineContent ||
        event.target === els.timelineGrid ||
        event.target === els.clipsLayer;
      if (!isTimelineBlank) return;
      startTimelineSelectionDrag(event);
    });
    els.playhead.addEventListener("pointerdown", startPlayheadDrag);

    els.playButton.addEventListener("click", () => {
      if (state.playing) pause();
      else play();
    });
    els.stopButton.addEventListener("click", () => {
      pause();
      setPlayhead(0, true);
    });
    els.playheadRange.addEventListener("input", (event) => {
      setPlayhead(Number(event.target.value), true);
    });

    els.frameButtons.forEach((button) => {
      button.addEventListener("click", () => cycleFrameRatio(button.dataset.frameRatio));
    });
    els.mediaScaleInput.addEventListener("input", (event) => {
      const clip = getSelectedVisualClip();
      if (!clip) return;
      clip.mediaScale = clamp(Number(event.target.value) || 1, 0.25, 3);
      updatePreview(false);
    });
    els.mediaResetButton.addEventListener("click", resetMediaTransform);
    els.backgroundButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.hasAttribute("data-bg-transparent")) {
          state.backgroundMode = "transparent";
        } else {
          state.backgroundMode = "solid";
          state.backgroundColor = button.dataset.bgPreset || "#ffffff";
        }
        applyCompositionStyles();
      });
    });
    els.backgroundColorInput.addEventListener("input", (event) => {
      state.backgroundMode = "solid";
      state.backgroundColor = event.currentTarget.value;
      applyCompositionStyles();
    });
    els.gradientToggleButton.addEventListener("click", () => {
      state.backgroundMode = "gradient";
      state.gradientPanelOpen = !state.gradientPanelOpen;
      applyCompositionStyles();
    });
    els.gradientTypeInput.addEventListener("change", (event) => {
      state.backgroundMode = "gradient";
      state.gradientType = event.currentTarget.value;
      applyCompositionStyles();
    });
    els.gradientAngleInput.addEventListener("input", (event) => {
      state.gradientAngle = clamp(Number(event.currentTarget.value) || 0, 0, 360);
      applyCompositionStyles();
    });
    els.gradientScaleInput.addEventListener("input", (event) => {
      state.gradientScale = clamp(Number(event.currentTarget.value) || 100, 20, 300);
      applyCompositionStyles();
    });
    els.gradientAddButton.addEventListener("click", addGradientStop);
    els.gradientRemoveButton.addEventListener("click", removeGradientStop);
    [els.previewImage, els.previewVideo].forEach((media) => {
      media.addEventListener("pointerdown", startMediaDrag);
    });
    els.viewerStage.addEventListener("pointerdown", (event) => {
      if (event.target === els.viewerStage && isFreeGradientEditing()) {
        addFreeGradientPoint(event.clientX, event.clientY);
        return;
      }
      if (event.target === els.viewerStage || event.target === els.previewVisualLayer) {
        clearSelectedClips();
        updatePreview(false);
      }
    });
    els.viewerStage.addEventListener("wheel", (event) => {
      const clip = getSelectedVisualClip();
      if (!clip) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? -0.05 : 0.05;
      clip.mediaScale = clamp(clip.mediaScale + direction, 0.25, 3);
      updatePreview(false);
    }, { passive: false });

    els.imageGridInput.addEventListener("input", (event) => {
      state.imageGridLength = Math.max(1, parseDecimalInput(event.target.value, state.imageGridLength));
      updateImageAssetDurations();
      render();
    });
    els.imageGridInput.addEventListener("change", () => {
      els.imageGridInput.value = formatDecimalInput(state.imageGridLength);
    });
    els.applyImageGridButton.addEventListener("click", applyImageGridLengthToAll);
    els.snapInput.addEventListener("change", (event) => {
      state.snap = event.target.checked;
    });
    els.gridSecondsInput.addEventListener("input", (event) => {
      state.gridSeconds = clamp(parseDecimalInput(event.target.value, state.gridSeconds), 0.05, 60);
      updateImageAssetDurations();
      render();
    });
    els.gridSecondsInput.addEventListener("change", () => {
      syncGridSecondsInput();
    });
    els.outputLengthInput.addEventListener("input", () => {
      applyOutputLength(getOutputLengthValue());
    });
    els.outputLengthInput.addEventListener("change", () => {
      applyOutputLength(getOutputLengthValue());
    });
    els.fpsInput.addEventListener("input", () => {
      render();
    });
    els.zoomInput.addEventListener("input", (event) => {
      state.zoom = Number(event.target.value);
      render();
    });
    els.gridSecondsUpButton.addEventListener("click", () => adjustGridSeconds(0.1));
    els.gridSecondsDownButton.addEventListener("click", () => adjustGridSeconds(-0.1));

    actionGrid.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      handleAction(button.dataset.action);
    });
    els.exportButton.addEventListener("click", exportRenderedVideo);
    els.exportPanelToggle.addEventListener("click", () => {
      setExportPanelOpen(!state.exportPanelOpen);
    });
    els.formatButtons.forEach((button) => {
      button.addEventListener("click", () => setExportFormat(button.dataset.format));
    });

    window.addEventListener("pointermove", moveDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("resize", () => {
      renderTimeline();
      applyCompositionStyles();
    });
    window.addEventListener("keydown", (event) => {
      const target = event.target;
      const isEditingText = target &&
        (target.matches("input, textarea, select") || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && !isEditingText) {
        event.preventDefault();
        selectAllTimelineClips();
        render();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        deleteSelectedClip();
      }
      if (event.key === " ") {
        event.preventDefault();
        if (state.playing) pause();
        else play();
      }
    });

    document.addEventListener("dragover", (event) => {
      if (event.dataTransfer && Array.from(event.dataTransfer.types).includes("Files")) {
        event.preventDefault();
      }
    });
    document.addEventListener("drop", (event) => {
      if (event.dataTransfer && event.dataTransfer.files.length) {
        event.preventDefault();
        addFiles(event.dataTransfer.files);
      }
    });
  }

  attachEvents();
  render();
})();

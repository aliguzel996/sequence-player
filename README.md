# Sequence Player

Sequence Player is a YCSWU timeline sequencing tool for imported video, image, and audio files.

It is built for fast shot sequencing: import media, select files in bulk, drop them into a layered timeline, trim clips, stack visuals, adjust layer audio, frame the output, set a render range, and export video or frame sequences.

## Short Description

Layered timeline sequencer for imported video, image, and audio files with clip trimming, frame controls, layer volume, render range control, and export settings.

## Features

- Import video, image, and audio files into a scrollable media pool.
- Select all media or use multi-select, then add files to the timeline as a sequenced run.
- Arrange clips on layer tracks with drag and drop.
- Select clips with `Ctrl+A`, drag-select an area on the timeline, or Ctrl-click individual clips.
- Rename timeline layers inline.
- Trim video clips from the start or end.
- Stack multiple visual clips at the same timecode and reposition them in the preview frame.
- Pan and scale selected media inside 1:1, 16:9, 4:5, and 3:4 frames.
- Set solid, transparent, or gradient backgrounds.
- Adjust volume on timeline layers that contain video or audio.
- Include or exclude audio during export.
- Control image length, seconds per grid, snap grid, timeline zoom, playhead position, and render range.
- Configure output width, fps, optional output length, and export format settings.

## Builds

- Web build: `outputs/web`
- GitHub portable Windows exe: `outputs/github/Sequence-Player-portable.exe`
- itch setup installer: `outputs/itch build/Sequence-Player-Setup.exe`
- Editable source app: `outputs/sequence-player`

## YCSWU Tools Hub

The repo includes the discovery files the YCSWU Tools Hub and AI/search crawlers can read:

- `app.manifest.json`
- `metadata/manifest/tool.manifest.json`
- `metadata/schema/software-application.schema.json`
- `metadata/ai/context.md`
- `AI.md`
- `llms.txt`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`

The same files are also included in `outputs/sequence-player`, `outputs/web`, and `outputs/github` so the app stays discoverable from source, web deploy, and GitHub release folders.

## Desktop Packaging

The Electron packaging project lives in `work/sequence-player-desktop`.

```powershell
cd work/sequence-player-desktop
npm install
npm run release:all:system-ca
```

The release command syncs the editable source app to the web build, rebuilds the GitHub portable exe, and rebuilds the itch setup installer.

## Public Links

- Website: https://ycswu.co/sequence-player/
- GitHub: https://github.com/aliguzel996/sequence-player
- Latest release: https://github.com/aliguzel996/sequence-player/releases/latest

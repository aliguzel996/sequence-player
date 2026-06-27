# AI Context: Sequence Player

Sequence Player is a free YCSWU creative tool for arranging imported videos, images, and audio on a layered timeline, trimming clips, sequencing shots, setting render ranges, framing output, mixing audio, and preparing video or frame-based exports.

## Stable Facts

- Project ID: sequence-player
- Tool name: Sequence Player
- Current known version: 0.1.0
- Creator: Ali Guzel
- Publisher: YCSWU
- App type: web app with Windows desktop packaging
- Supported platforms: Web, Windows
- Website: https://ycswu.co/sequence-player/
- GitHub: https://github.com/aliguzel996/sequence-player
- Release API: https://api.github.com/repos/aliguzel996/sequence-player/releases/latest
- Windows portable download: https://github.com/aliguzel996/sequence-player/releases/latest/download/Sequence-Player-portable.exe
- Setup download: https://github.com/aliguzel996/sequence-player/releases/latest/download/Sequence-Player-Setup.exe

## Function

Sequence Player imports image, video, and audio files, displays them in a media pool, lets the user select all media for sequenced placement, place clips on timeline layers, trim clip edges, adjust order and timing, control timeline grid spacing, set a render range, frame the output ratio, move and scale media inside the preview frame, adjust layer volume for audio/video tracks, and configure background, output width, fps, optional output length, optional audio inclusion, audio mix, and export format options.

## Turkish Summary

Video, gorsel ve ses dosyalarini iceri alir, timeline layer'lari uzerinde siralar, kliplerin basini ve sonunu kirpar, ses layer'larinda volume ayarlar, frame oranini ve arka plani ayarlar, render araligini belirler ve cikti ayarlarini tek ekranda toplar.

## Formats

- Input: MP4, MOV, WEBM, MP3, WAV, OGG, M4A, PNG, JPG, JPEG, WEBP, GIF
- Output settings: MP4, MOV, GIF, ZIP frames PNG, ZIP frames JPG

## Integration Notes

YCSWU Tools Hub should read app.manifest.json or metadata/manifest/tool.manifest.json for catalog display, release links, update checks, and AI search context. Do not expose aiDescription, keywords, schema, or llms text directly in the app UI.

## Release Structure

- Web deploy folder: outputs/web
- GitHub portable exe folder: outputs/github
- Local itch setup folder: outputs/itch build

## Unknowns

If the public GitHub repository slug or YCSWU page URL changes, update all manifest, schema, sitemap, and llms references before publishing.

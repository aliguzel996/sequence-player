# Sequence Player

Sequence Player is a YCSWU creative tool for sequencing imported video, image, and audio files on a layered timeline.

## Builds

- Web build: `outputs/web`
- GitHub portable Windows exe: `outputs/github/Sequence-Player-portable.exe`
- itch setup installer: `outputs/itch build/Sequence-Player-Setup.exe`
- Editable source app: `outputs/sequence-player`

## Desktop Packaging

The Electron packaging project lives in `work/sequence-player-desktop`.

```powershell
cd work/sequence-player-desktop
npm install
npm run release:all:system-ca
```

The release command syncs the editable source app to the web build, rebuilds the GitHub portable exe, and rebuilds the itch setup installer.

## Metadata

AI/search crawler files are included with the app:

- `AI.md`
- `llms.txt`
- `app.manifest.json`
- `metadata/manifest/tool.manifest.json`
- `metadata/schema/software-application.schema.json`
- `metadata/ai/context.md`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`

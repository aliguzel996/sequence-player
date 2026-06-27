# Sequence Player Build Layout

- `web/`: static web build, copy this folder for web hosting.
- `github/`: portable Windows desktop exe for GitHub releases.
- `itch build/`: installer setup exe for itch.io uploads.

Run from `work/sequence-player-desktop`:

```powershell
npm run release:all
```

If npm or Electron downloads hit Windows certificate-chain errors, run:

```powershell
npm run release:all:system-ca
```

Future source updates should be made in `outputs/sequence-player`, then `npm run release:all` should be run again so all three build folders stay in sync.

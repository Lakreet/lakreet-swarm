# CLI stdout/stderr and progress (S0-6)

Date: 2026-10-14
EffectCraft version: 0.8.0 (headless)

Commands:

```powershell
node scripts/raw-output.js render --template examples/title2.ectemplate --values out/1-Budi.values.json --out out/raw.mp4
node scripts/raw-output.js render --template examples/title2.ectemplate --values out/1-Budi.values.json --out out/raw2.mp4 --json
```

## Plain mode (no `--json`)

Both lines go to **stderr**, nothing on stdout:

```
ERR: "Comp 2 -> E:\...\out\raw.mp4 (1920x1080, 300 frames, H.264 - Match Render Settings - 15 Mbps)\n"
ERR: "done: Comp 2 -> E:\...\out\raw.mp4 in 16.84s\n"
exit 0
```

## `--json` mode

The human header and `done:` line still go to **stderr**. Stdout receives a single-line JSON summary:

```json
{ "rendered": [{ "comp": "Comp 2", "output": "E:\\...\\out\\raw2.mp4", "seconds": 16.1571042 }] }
```

## Findings

- **No per-frame progress** in either mode when output is captured through a pipe. Progress is only
  emitted when attached to a TTY.
- Line separator: `\n` (LF), even on Windows.
- `--json` does **not** change progress; it adds a machine-readable summary on stdout.
- Therefore P2-12 keeps the **time-based estimate** (the existing `reported` frame parser in
  `src/run-cli.js` simply never fires in captured mode, which is fine).

# Parallel render benchmark (S0-5)

Date: 2026-10-14
EffectCraft version: 0.8.0 (headless)
Host: Windows, Node v24.13.0

Command: `node scripts/bench-parallel.js`
Template: `examples/title2.ectemplate` (1920x1080, 10.01 s, 300 frames)

| concurrency | videos | total time | throughput | failed |
| ----------- | ------ | ---------- | ---------- | ------ |
| 1           | 8      | 130.6 s    | 1.00x      | 0      |
| 2           | 8      | 118.0 s    | 1.11x      | 0      |
| 4           | 8      | 116.3 s    | 1.12x      | 0      |

## Decision

The document's rule: allow `--jobs` (default 1, cap `os.availableParallelism()`) only if 2 processes
give **at least 1.5x** throughput **and no failures**. Here there were no failures, but the speedup
is only **1.11x** at 2 workers and **1.12x** at 4.

Render is already saturating the machine (GPU/encoder bound), so extra processes add memory and CPU
pressure without real gain.

**Conclusion: postpone P2-11 (`--jobs`).** Keep rendering sequential. Revisit if EffectCraft adds
per-process resource limits or if a future version scales better.

# ADR-0001: Data model (draft - based on findings so far)

Status: proposed
Date: 2026-10-14

## Context

Based on Fase 0 research so far:

- S0-5 (parallel): 2x gives 1.11× speedup, 4x gives 1.12× speedup, no failures. The threshold is 1.5×; so we should **not** enable parallel rendering (`--jobs > 1`) yet.
- S0-6 (progress/JSON): No per-frame progress when output is captured (plain mode prints header+done on stderr). `--json` adds a JSON summary on stdout. No progress events; keep **time-based estimate**.
- S0-2 (media via `--values`): Attempted string, `{path:...}`, `{item:...}` - all rejected. Media replacement via `--values` is **not supported**. The document's "mode pipeline" (create temp project, import template, `essential.set` with media, render from project) is required if we want to swap media. For the initial implementation (P1-06), we need to decide: follow the pipeline (more complex) or defer media swapping until we have a working pipeline strategy? But the user wants the full flow. Let us look up how essential.set handles media.

From manifest: media control is `kind: media, type: media`. `essential.set` takes `control: id|name, value | item (media)`. So setting media likely means passing `item` (file/item reference).

## Decisions (proposed)

1. **Progress source**: time-based estimate (no frame-level progress from CLI when piped). Do not rely on parsing frame numbers.
2. **Parallel rendering**: default `--jobs 1`. Do **not** implement `--jobs > 1` for v0.3.0 (or until speedup ≥ 1.5× at 2 workers). Keep design flexible for later.
3. **Media in data**: Because `--values` cannot carry media file paths for media controls, the current "direct render from template with values" approach cannot swap media. We need **pipeline mode**: for rows with media columns, import template into a temporary project, set media controls via `essential.set`, then render from project. This affects P1-06 and render logic.
4. **Value formats (scalar controls)**: For text controls, pass string as-is. For slider controls, pass numbers. (Other types TBD in S0-3).
5. **Empty cells**: Per document: empty cell on non-text → use template default; empty on text → empty string (with `--empty-as-default` option to use default).
6. **Missing columns**: Use template default.
7. **Unknown columns**: Error, unless prefixed with `#` (comment).

## Consequences

- `src/render.js` and `src/run-cli.js` need to support both modes: direct template render (fast, works for scalar controls) and pipeline render (slower, needed for media).
- Media validation must happen before rendering (check file exists, supported format).
- Tests need to be aware of the limitation; integration tests with fake runner must cover both modes.
- S0-2 findings strongly suggest we cannot do media replacement via the current simple path. So P1-06 must be implemented with pipeline mode in mind.

This ADR is draft; update after completing S0-3, S0-4.

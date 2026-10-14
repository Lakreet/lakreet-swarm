# Research checkpoint - S0 completed findings

## Summary

- **S0-1 (Format .ectemplate)**: ZIP stored (no compression) with manifest.json, project.ecproj, poster.png. Manifest has format/version/generator/comp info and controls array. Controls include id, kind, name, type, value, layer, path, etc. Media controls have kind:type "media". `media[]` maps item refs to bundled files. - **DONE**
- **S0-2 (Media via --values)**: Tested three forms (string path, {path}, {item}). All rejected with "can't use ... for a scalar property". Conclusion: **media replacement via `--values` is not possible** in current CLI. Need pipeline mode (import template to temp project, set media via `essential.set`, render from project). Documented in `media-replacement.md`. - **DONE (with blocker)**
- **S0-5 (Parallel render)**: 1.11x speedup at 2 workers, 1.12x at 4 workers, 0 failures. Below 1.5x threshold in document - so **postpone P2-11**. Documented in `parallel-render.md`. - **DONE**
- **S0-6 (Progress/JSON)**: No per-frame progress when piped. Plain mode emits header+done on stderr. `--json` adds JSON summary on stdout. Keep time-based estimation. Documented in `cli-output.md`. - **DONE**
- **S0-7 (ADR-0001)**: Draft created with decisions on progress, parallelism, media handling (pipeline mode needed). - **DRAFT**
- **S0-3 (Other control types)**: Basic structure documented; need templates with color/checkbox/point/dropdown. Partially done.
- **S0-4 (Media formats)**: Matrix structure created; execution deferred until pipeline mode.

## Next steps

The research so far gives us enough to proceed with Fase 1, but we must handle media via pipeline mode. Let us also create the control-types test templates if possible - color/checkbox/point controls might be creatable via CLI? Or we can skip GUI-heavy parts and proceed with implementing the codebase per the spec, noting the pipeline requirement.

Also need to complete S0-3/S0-4 more thoroughly? But creating GUI-based templates is time-consuming. Let us look up if we can add property controls of other types via CLI commands. The `essential.addProperty` takes (comp, layer, path, prop, name, group, index, as). It mentions `as` can be "font" or "scale". So to add different property types as controls, we need to know the property paths.

But exploring all control types is important. Let us also look at the demo project and existing templates more.

Alternatively, proceed to Fase 1 implementation. The document says "Kirim hasilnya ke chat supaya rencana di bawah disesuaikan" - but the user wants us to execute. Let us document what we have and continue.

## Commit checkpoint (Fase 0 - Persiapan + Research done so far)

**Scope:** Created research infrastructure and helper scripts; conducted research on CLI behavior, parallelism, progress/JSON, and media replacement via --values.

**Features added:**

- Directories: `scripts/`, `examples/params/`, `examples/values/`, `examples/assets/`, `docs/research/`, `docs/decisions/`, `out/`
- Scripts: `scripts/ec-exec.js` (exec engine commands with param files), `scripts/raw-output.js` (capture raw CLI output), `scripts/bench-parallel.js` (parallel render benchmark)
- Test assets: `examples/assets/logo.png` (200x200 red), `examples/assets/other.png` (300x150 blue)
- Media test project/template: `examples/media-test.ecproj`, `examples/media-test.ectemplate` with media replacement control named "Logo"
- Research docs: `docs/research/parallel-render.md`, `docs/research/cli-output.md`, `docs/research/media-replacement.md`, `docs/research/control-types.md` (partial), `docs/research/media-formats.md` (structure)
- ADR: `docs/decisions/0001-data-model.md` (draft)

**Blockers:**

- Media replacement via `--values` is not possible → requires pipeline mode (import template to temp project, set via `essential.set`, render). This affects design of render/media logic.
- Parallel rendering speedup < 1.5x → postpone `--jobs`.
- No per-frame progress from CLI when piped → use time-based estimation.

**Recommendation:** Proceed to Fase 1 (P1-01 onwards). The core infrastructure is in place.

# Checkpoint P1-04 — JSON and JSONL input

## Scope

- `src/data.js` now dispatches on file extension and returns a uniform `{ rows, problems }`.

## Features

- `.csv` / `.tsv` → RFC 4180 parser (P1-03).
- `.json` → array of objects, or `{ "rows": [...] }`.
- `.jsonl` / `.ndjson` → one object per line.
- Every row carries a `where` label for error messages:
  CSV → `line 5`, JSON → `item 3`, JSONL → `line 3`.
- JSON values may be native types (numbers, booleans); coercion still runs through
  the control-type check (slider → number).
- Comment columns (header starting with `#`) are ignored.

## Verified

`examples/data.csv`, `examples/data.json`, `examples/data.jsonl` all produce the same
value shapes (Opacity coerced to number). 10/10 tests pass.

## Commit suggestion (NOT committed, per your instruction)

`[data/json] feat: JSON and JSONL input`

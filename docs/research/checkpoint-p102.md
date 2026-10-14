**CHECKPOINT: P1-02 (Kerangka tes)**

**Scope:** Set up test infrastructure with node:test.

**Features added:**

- Created `test/` directory.
- Added `test/safe-name.test.js` with 3 unit tests for `safeName()` function (from Lampiran G).
- Tests verify: replacement of invalid Windows filename chars, fallback to 'untitled' for empty/whitespace, length limit to 60 chars.

**Test results:** 3 tests passing. All green.

**Commit suggestion (do NOT commit now per instruction):** `[test] test: safeName unit tests`

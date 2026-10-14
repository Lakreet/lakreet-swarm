**CHECKPOINT: P1-01 (Dasar perkakas)**

**Scope:** Set up development tooling and config files.

**Features added:**

- Added Prettier as devDependency (`prettier@^3.6.2`).
- Added npm scripts: `start`, `test`, `format`, `format:check` in `package.json`.
- Created config files: `.editorconfig`, `.prettierrc.json`, `.prettierignore`, `.gitattributes`.
- Updated `.gitignore` with coverage, logs, cache dirs.
- Formatted all existing source files and docs with Prettier. `npm run format:check` passes.
- Verified CLI still works: `node src/cli.js --help` runs.

**Changes:**

- `package.json` - scripts + devDependencies
- `.editorconfig`, `.prettierrc.json`, `.prettierignore`, `.gitattributes`, `.gitignore` (new/updated)
- All existing `.js`, `.md`, `.json` files reformatted

**Note:** Existing `src/*.js` files reformatted to match LF line endings and Prettier rules. No functional changes.

**Commit suggestion (do NOT commit now per instruction):** `[project] chore: add prettier, editorconfig and line ending rules`

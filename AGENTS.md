# AQW Vietnam Guide — Codex project rules

- Repository: `aqw-vietnam-guide` (React, TypeScript, Vite). Version = `package.json`, not a hard-coded number.
- The current task alone defines the scope. Do not read old Codex conversations, task backups, V12.x prompts/audits without a specific dependency.
- Find files by explicit path or narrowly scoped search. Avoid dumping entire JSON/assets folders.
- Fix source-of-truth generators as needed; the production build can regenerate Class, Boss and Calendar data.
- Preserve Class families/variants, acquisition, skills, combos, existing routing and sources. Do not invent Wiki facts, artwork or abbreviations.
- Test targeted logic and `npm run typecheck` before broad tests; run `npm run build` once when integration verification is necessary, inspect generated diff.
- No Git push/deploy, D1 changes, destructive filesystem commands or cross-project edits without a task-specific explicit request.
- Browser QA is unverified unless actually run. Summarize changed files, checks, and remaining issues briefly.
- `Update/_codex-focus/STATE.md` is optional and may be empty; only read it if current task explicitly depends on unfinished work. Do not preserve full prompt history in STATE.

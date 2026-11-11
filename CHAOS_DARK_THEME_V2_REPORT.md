# Chaos Dark Theme V2 — source-aware integration

Actual stack: React 19 / Vite; plain source CSS, no Tailwind or CSS-in-JS. ThemeToggle and index bootstrap own data-theme and aqw-theme localStorage. Source of truth: src/styles/themes.css. Removed only AQW CHAOS THEME V2 START/END installer block from index.html, including its competing MutationObserver.

| Token | Dark value |
|---|---|
| background | #08050D |
| surface | #130D1D |
| raised | #20132F |
| border | #4B3265 |
| accent | #A65BFA |
| hover | #D2A5FF |
| focus | #C58BFF |
| text | #F5F0FF |
| secondary text | #B9AACD |

Existing ultra/class aliases and source component declarations consume these tokens. Original Light root neutral palette is retained byte-for-byte against tests/fixtures/light-theme-palette.css; all new aliases are dark-scoped. Old neutral hex fallbacks remain intentionally for Light Mode. The newer Boss/Class UI request intentionally replaces per-entity Light accents while retaining the Endfield neutral base. Warning/danger/positive and class role semantic colors are preserved. Home SVG accent now consumes the dark alias while keeping its original Light fill. Button hover and focus consume dedicated theme tokens.

## Files changed for theme

- index.html: remove marked installer only.
- src/styles/themes.css: canonical dark tokens, legacy aliases, interaction colors and existing tracker source declarations.
- src/styles/global.css: inverse surfaces, accent contrast, focus and hover tokens.
- src/styles/ultra/codex.css, v9.css, v12-5.css: replace literal theme accent/surface/border declarations with scoped aliases and original Light fallbacks.
- src/features/Home.tsx: SVG accent token.
- src/features/ultra/UltraBoss.tsx and src/features/classes/ClassDirectory.tsx, ClassDetail.tsx: inline identity accents now use separate per-entity dark/light mapping variables per the latest request, replacing the earlier uniform purple rule.
- tests/chaos-theme.test.mjs, tests/fixtures/light-theme-palette.css and scripts/qa-chaos-theme.mjs: toggle persistence, source palette regression and external computed-style/screenshots runner.

## Checks

- lint: passed (artifacts/qa/v12-6/lint.log)
- typecheck: passed (artifacts/qa/v12-6/typecheck.log)
- test: passed (artifacts/qa/v12-6/test.log)
- test:semantic: passed (artifacts/qa/v12-6/test-semantic.log)
- assets:validate-class-skills: passed (artifacts/qa/v12-6/assets-validate-class-skills.log)
- build: passed (artifacts/qa/v12-6/build.log)
- test:build: passed (artifacts/qa/v12-6/test-build.log)
- test:server: passed (artifacts/qa/v12-6/test-server.log)

Toggle interaction and Light token regression tests passed. Browser computed-style/screenshot status: browser_launch_blocked; screenshots 0. Chromium MachPortRendezvous Permission denied (1100); WebKit Abort trap 6. No visual pass. Run npm run qa:chaos-theme in normal macOS Terminal; results in artifacts/qa/chaos-theme/.

## Remaining literal colors

Legacy root defaults and var() fallback values remain for the unchanged Light palette; semantic warning/status/role colors, monochrome illustration ink and official game artwork are intentionally preserved. No known accidental legacy gold/amber theme accent remains in the reviewed source components. Runtime coverage of nested dialogs, selected equipment and all hover states is still pending real browser execution; this is not a claim that every computed color has been visually verified.

Version stays 0.1.0. No Cloudflare/D1/binding changes, push or deploy.

## Latest per-entity accent request

The newer user request supersedes uniform purple accents on Boss/Class details: retain Chaos dark neutrals, but use explicit Boss dark/light accent mappings and contrast-adjusted Class identity colors. Endfield light neutral root tokens remain unchanged; per-entity light accents intentionally change. See src/content/presentation/bosses.json and BOSS_CLASS_UI_CONTENT_REPORT.md.

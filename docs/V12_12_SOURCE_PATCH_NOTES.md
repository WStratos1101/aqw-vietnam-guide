# AQW V12.12 – source-level update

This is a non-destructive source patch for the current `WStratos1101/aqw-vietnam-guide` repository (main branch, inspected 2026-11-11). It is intended to be imported using Update AutoSync v3.2.

## Changed source

- `src/main.tsx`: imports one scoped CSS override file, preserving all existing entrypoint logic.
- `src/styles/v12-12-overrides.css`: prevents global Chaos purple from overriding per-boss color in dark mode; keeps the same boss hue identity in light mode; expands and contains full-body class art in directory, detail, alternatives and starter selector.
- `scripts/qa-v12-12.mjs`: offline audit of abbreviations, Calendar Family deduplication, artwork paths, and the Dage/Gramiel/Nulgath palette.

## Existing implementation confirmed; not rewritten

The current repository already has a Calendar Family registry with verified pairs for Corrupted/Timeless, Underworld/Overworld, Quantum/Continuum, TimeKeeper/TimeKiller, and other groups. It also has a source-backed Class identity registry and boss palette metadata. These are kept intact to avoid breaking skill sets, class acquisition, or old class routes.

Some Class identities lack a verified abbreviation. Do not synthesize an abbreviation from the name. `node scripts/qa-v12-12.mjs` lists all missing abbreviation evidence and checks family structure. Content needing additional evidence must stay pending.

## Limitations

- CSS `object-fit: contain` prevents layout cropping but cannot restore body parts that are missing from the underlying source PNG itself.
- No live browser QA has been run on the user's Mac.
- No new artwork or unverified class abbreviation has been invented.
- This patch does not touch D1 or migration files.
- Source may change after the reference GitHub HEAD; review the update plan if local changes overlap `src/main.tsx`.

## QA on macOS

```bash
node scripts/qa-v12-12.mjs
npm run build
```

Run the pre-existing external browser QA tooling for visual checks.

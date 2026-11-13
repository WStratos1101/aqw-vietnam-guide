# Farm V2 source workflow

Version is read from package.json. No release action is part of this workflow.

- `npm run content:farm:sources -- --wiki-limit 150` reads public source pages with at most two concurrent requests, finite timeouts and no automatic retry loop. It reads only linked Wiki URLs, never guesses item URLs. Raw HTTP caches under `Update/_farm-direct/sources` are optional. Review `source-access.json` for failures and pending URLs. A Google Docs text export does not establish embedded content coverage.
- `python3 scripts/import-farm-sources.py --offline --wiki-limit 0` replays available source snapshots without network. `--refresh-sites` refreshes the Sites extraction from its HTTP cache or the authorized public source. This flag does not refresh cached Wiki pages.
- `npm run content:farm` builds the curated catalog, then V2 and its route index, validates both, and regenerates source audit. The production build runs the same adapter offline. It requires checked-in `content-sources/farm/import` snapshots; it never fetches live Wiki data.
- `npm run test:farm`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:build` verify distinct layers. Happy DOM tests do not establish layout or browser PASS.

The curated `verified-items.json` remains authoritative for existing recipes and sourced route geography. V2 imports classify equipment from Wiki page tags, preserve exact Wiki titles and literal source references, and keep new technical routes/availability as needs-review. Material, house, monster and ambiguous pages stay in the source ledger, outside equipment. Counts refer to canonical identities, never attempted merges or source-line counts.

`source-extracts.json` stores full visible source text, links and image references. `wiki-records.json` stores parsed Wiki evidence. The deterministic build writes `source-accounting.json` with every nonempty source line, `image-review.json` with every embedded image reference, and `coverage.json`. A line containing an imported reference may still contain other unreviewed references; matching one name never certifies the full line. Pending lines are context-review units, not a count of missing equipment. `FARM_DATA_AUDIT.md` lists exact item verification and image gaps.

Do not use the older `Update/_farm-direct` UI installer to update this implementation: its template API did not connect the actual Directory route and its heuristic category extraction included non-equipment. Use the package scripts above; the new adapter preserves curated identities and approved artwork.

No push, commit, deploy or Auto Publish is run. The existing QA gate is unchanged. Browser BLOCKED and incomplete source coverage keep the result PARTIAL.

## Browser QA ngoài sandbox

Không khởi chạy browser trong Codex. Trên Terminal macOS chạy từ project:

```sh
./AQW-Safe-Browser-QA.command
```

Script chỉ dùng Chromium, kiểm tra binary/dependencies và thử đúng một lần. Không tự cài package, không publish. Kết quả: `artifacts/qa/farm/results.json`, screenshot cùng thư mục; log Terminal: `artifacts/qa/farm/external/terminal.log`. Chỉ kết quả thực tế mới xác nhận PASS. Nếu binary thiếu, chạy riêng lệnh cài được script in ra rồi chạy lại ngoài sandbox.

Importer tái sử dụng cache Wiki tại các thư mục `content-sources/class-wiki`, `content-sources/class-acquisition`, `content-sources/v12-6/wiki` chỉ khi đúng URL đã được nguồn A/B liên kết, có nội dung Wiki/tag và không mâu thuẫn canonical URL. Cache không được gán ngày xác minh mới. `--offline --reparse-cache --wiki-limit 0` dùng để đối chiếu lại cache sau khi sửa parser, không tải nguồn.

## Supporting location batches

`wiki-reviewed-pages.json` stores explicitly reviewed web-reader support pages and their evidence files. Only exact URLs already in the source reference queue affect its pending count. Location/Region pages do not become equipment records. `geography-evidence.json` maps exact source location labels to sourced commands and, only where proven, Region IDs. Region-map support and item identity verification remain separate. `geography-changes.json` records adapter changes per route. No browser or live-game synchronization is involved.

`missing-image-audit.json` retains source-page candidates for every missing image. These are unverified candidates, not approved artwork; keep the missing-image fallback until identity, policy and actual file bytes pass review. `source-batches.json` records counts and checks for the latest bounded batch, separate from previous full integration QA.

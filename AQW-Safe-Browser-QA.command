#!/bin/zsh
# Run manually from normal macOS Terminal, never inside the Codex sandbox.
set -eu
setopt PIPE_FAIL
cd -- "${0:A:h}"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"
export FARM_BROWSER=chromium
export AQW_BROWSER=chromium
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  print -u2 'Node.js và npm chưa có trong PATH.'
  exit 1
fi
node --input-type=module <<'JS'
import fs from 'node:fs';
const resultPath = 'artifacts/qa/farm/results.json';
fs.mkdirSync('artifacts/qa/farm', {recursive: true});
const report = {kind: 'farm', status: 'not_run', phase: 'configuration', browser: 'chromium',
  startedAt: new Date().toISOString(), cases: [], screenshots: [], errors: []};
fs.writeFileSync(resultPath, JSON.stringify(report, null, 2)+'\n');
const blocked = (message) => {
  report.status = 'blocked'; report.errors.push(message);
  fs.writeFileSync(resultPath, JSON.stringify(report, null, 2)+'\n');
  console.error(message); process.exit(1);
};
let chromium;
try { ({chromium} = await import('@playwright/test')); }
catch { blocked('Thiếu dependencies. Chạy npm ci trong thư mục project trước.'); }
const executable = chromium.executablePath();
try { fs.accessSync(executable, fs.constants.X_OK); }
catch { blocked('Chưa có Chromium khả dụng: '+executable+'\nCài một lần: PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers" npx playwright install chromium'); }
console.log('Chromium binary: '+executable);
JS
mkdir -p artifacts/qa/farm/external
# One attempt only; qa-farm writes results.json and screenshots. No retry/install/publish.
npm run browser:smoke 2>&1 | tee artifacts/qa/farm/external/terminal.log

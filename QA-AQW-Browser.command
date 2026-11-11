#!/bin/zsh
# Double-click in Finder or run from an ordinary macOS Terminal.
set -u
cd -- "${0:A:h}" || exit 1
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  print 'Node.js và npm chưa có trong PATH. Cài Node rồi chạy lại.'
  exit 1
fi
if [[ ! -f node_modules/@playwright/test/package.json || ! -f node_modules/vite/package.json ]]; then
  print 'Thiếu dependencies. Trong thư mục này, chạy: npm ci'
  exit 1
fi
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.playwright-browsers"
npm run qa:browser
qa_status=$?
print 'Báo cáo: qa/results.json | Logs: qa/logs/ | Screenshots: qa/screenshots/'
exit "$qa_status"

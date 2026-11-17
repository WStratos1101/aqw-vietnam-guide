// Configure before importing Playwright. All downloaded binaries/temp stay in this repo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const qaBrowserRoot=fileURLToPath(new URL('../Update/_qa-browsers/',import.meta.url));
fs.mkdirSync(path.join(qaBrowserRoot,'.tmp'),{recursive:true});
process.env.PLAYWRIGHT_BROWSERS_PATH=qaBrowserRoot;
process.env.TMPDIR=path.join(qaBrowserRoot,'.tmp');

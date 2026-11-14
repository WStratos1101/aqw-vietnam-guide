import fs from "node:fs";
import path from "node:path";
process.env.PLAYWRIGHT_BROWSERS_PATH = path.resolve(".playwright-browsers");
const { chromium } = await import("@playwright/test");
const root = "content-sources/farm/review", out = "artifacts/qa/farm/source-review";
fs.mkdirSync(out, { recursive: true });
const candidates = JSON.parse(fs.readFileSync(root + "/image-candidates.json")).filter(r => r.status === "downloaded");
const escape = s => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const browser = await chromium.launch({ chromiumSandbox: true });
const decoded = [];
try {
  for (let offset = 0; offset < candidates.length; offset += 20) {
    const rows = candidates.slice(offset, offset + 20);
    const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
    await page.setContent(`<style>body{margin:0;background:#ddd;display:grid;grid-template-columns:repeat(4,1fr);font:16px sans-serif}article{height:270px;border:1px solid #777;padding:4px;min-width:0}h2{font-size:17px;height:42px;margin:6px}img{width:100%;height:210px;object-fit:contain}</style>` + rows.map(r => `<article><h2>${escape(r.name)}</h2><img data-id="${r.itemId}" src="data:image/${r.candidatePath.split('.').at(-1)};base64,${fs.readFileSync(r.candidatePath).toString("base64")}"></article>`).join(""));
    decoded.push(...await page.locator("img").evaluateAll(async imgs => {
      for (const img of imgs) { try { await img.decode(); } catch {} }
      return imgs.map(img => ({ itemId: img.dataset.id, loaded: img.complete && img.naturalWidth > 0, width: img.naturalWidth, height: img.naturalHeight }));
    }));
    await page.screenshot({ path: `${out}/images-${offset / 20 + 1}.png`, fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
fs.writeFileSync(`${out}/image-decode.json`, JSON.stringify(decoded, null, 2) + "\n");
console.log({ sheets: Math.ceil(candidates.length / 20), decoded: decoded.filter(r => r.loaded).length, failed: decoded.filter(r => !r.loaded) });

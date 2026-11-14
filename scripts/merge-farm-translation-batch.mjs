// Explicit reviewed translations only. Canonical identity + exact source hash, no network.
import fs from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const catalog = read("src/content/farm/catalog-v2.generated.json");
const records = [
  ...read("content-sources/farm/import/wiki-records.json"),
  ...read("content-sources/farm/import/detail-wiki-records.json"),
];
const target = "content-sources/farm/import/detail-translations.json",
  translations = read(target);
const file = process.argv[2];
if (!file) throw Error("Pass a reviewed batch TSV file");
const effectsPath = file.replace(/\.tsv$/, ".effects.json");
const effects = fs.existsSync(effectsPath) ? read(effectsPath) : {};
let added = 0;
for (const line of fs
  .readFileSync(file, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)) {
  const [id, ...parts] = line.split("\t");
  const vi = parts.join("\t");
  if (!vi) throw Error("Empty translation " + id);
  const item = catalog.items.find((i) => i.id === id);
  if (!item) throw Error("Unknown canonical ID " + id);
  const record = records.find((r) => r.wikiUrl === item.wikiUrl);
  if (!record) throw Error("Missing exact snapshot " + id);
  const hash = createHash("sha256").update(record.text).digest("hex");
  const next = {
    sourceTextHash: hash,
    descriptionVi: vi,
    specialEffectsVi: effects[id] || null,
    reviewedAt: "2026-11-14",
    verificationStatus: "reviewed_translation",
    batch: file,
  };
  if (translations[item.wikiUrl]) {
    if (translations[item.wikiUrl].descriptionVi !== vi)
      throw Error("Refusing to overwrite completed translation " + id);
    continue;
  }
  translations[item.wikiUrl] = next;
  added++;
}
fs.writeFileSync(target, JSON.stringify(translations, null, 2) + "\n");
console.log({ file, added, total: Object.keys(translations).length });

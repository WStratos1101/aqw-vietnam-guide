import fs from "node:fs";
import { parseClassPage } from "./lib/calendar-class-parser.mjs";
const path = "src/content/classes/skill-registry.json";
const registry = JSON.parse(fs.readFileSync(path, "utf8"));
const sources = new Map();
const fixes = [];
for (const record of registry.skills) {
  if (record.verificationStatus !== "verified" || !record.sourceUrl) continue;
  if (!sources.has(record.sourceUrl)) {
    const slug = new URL(record.sourceUrl).pathname.slice(1);
    const snapshot = "content-sources/class-wiki/" + slug + ".html";
    const entries =
      fs.existsSync(snapshot) &&
      fs.readFileSync(snapshot, "utf8").includes("line-through")
        ? await parseClassPage(record.sourceUrl)
        : null;
    sources.set(record.sourceUrl, entries);
  }
  const page = sources.get(record.sourceUrl);
  if (page?.sourceHash !== record.sourceHash) continue;
  const matches = page.entries.filter(
    (entry) => entry.officialName === record.officialName,
  );
  if (matches.length !== 1 || !matches[0].hasRetiredValues) continue;
  const [skill] = matches;
  const changes = {
    rankRequirement: Number.isFinite(skill.rank) ? skill.rank : null,
    manaCost: skill.manaCost == null ? null : Number(skill.manaCost),
    manaCostDisplay: skill.manaCostDisplay,
    cooldown: skill.cooldown == null ? null : Number(skill.cooldown),
    cooldownDisplay: skill.cooldownDisplay,
    skillType: skill.skillType,
    officialDescription: skill.officialDescription,
    target: skill.target,
    wikiNotes: skill.notes,
  };
  const fields = Object.keys(changes).filter(
    (key) => JSON.stringify(record[key]) !== JSON.stringify(changes[key]),
  );
  if (fields.length) {
    const previous = Object.fromEntries(
      fields.map((key) => [key, record[key]]),
    );
    record.retiredValues = { sourceHash: record.sourceHash, previous, fields };
    Object.assign(record, changes);
  }
  if (record.retiredValues?.sourceHash === record.sourceHash) {
    fixes.push({
      classId: record.classId,
      skillId: record.skillId,
      skill: record.officialName,
      source: record.sourceUrl,
      ...record.retiredValues,
    });
  }
}
fs.writeFileSync(path, JSON.stringify(registry, null, 2) + "\n");
fs.mkdirSync("artifacts/qa/v12-10", { recursive: true });
fs.writeFileSync(
  "artifacts/qa/v12-10/retired-values.json",
  JSON.stringify(fixes, null, 2) + "\n",
);
console.log(
  "Retired Wiki values corrected for " + fixes.length + " skill records.",
);

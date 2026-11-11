import fs from "node:fs";
const p = "src/content/classes/skill-registry.json",
  r = JSON.parse(fs.readFileSync(p)),
  rules = JSON.parse(
    fs.readFileSync("src/content/classes/current-skill-reconciliation.json"),
  );
let count = 0;
for (const s of r.skills) {
  const rule = rules[s.classId];
  if (!rule || s.supplemental) continue;
  delete s.quarantined;
  if (
    rule.quarantineIds?.includes(s.skillId) ||
    (rule.quarantineIdPattern && s.skillId.includes(rule.quarantineIdPattern))
  ) {
    s.quarantined = true;
    s.verificationStatus = "manual_review";
    s.issue = rule.reason;
    delete s.iconAssetId;
    count++;
  }
}
fs.writeFileSync(p, JSON.stringify(r, null, 2) + "\n");
console.log({ quarantinedLegacyRecords: count });

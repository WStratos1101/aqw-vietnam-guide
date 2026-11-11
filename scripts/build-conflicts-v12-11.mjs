import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const initial = read("content-sources/v12-11/initial-queue.json");
const reviews = read("src/content/classes/verification-recovery-v12-11.json");
const guide =
  "https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit";
const conflicts = initial.skills
  .filter((e) => e.missingFields.includes("sourceConflict"))
  .map((e) => {
    const review = reviews.find(
      (r) => r.classId === e.classId && r.skillId === e.skillId,
    );
    const flight = e.skillName === "Flight",
      veil = e.skillName === "Crystallis Veil";
    return {
      id: review?.patch.conflictId || "crystallis-duration",
      classId: e.classId,
      className: e.className,
      skillId: e.skillId,
      skillName: e.skillName,
      field: flight
        ? "DoT damage increase"
        : veil
          ? "Buff durations"
          : "Rank 10 Quantum Spiral duration",
      currentWebsiteValue: e.currentValue.sourceConflict,
      wiki: {
        sources: e.sources,
        description: flight
          ? "75%"
          : veil
            ? "Damage Resistance +25% for 8s; Crit Chance +15% for 6s"
            : "Active Rank 10 note: 23s",
        notes: flight
          ? "50%"
          : veil
            ? "Damage Resistance 9s; Crit Chance 7s"
            : "Passive Quantum Spiral / Quantum Mending: 20s",
      },
      official: veil
        ? {
            source: "https://www.aq.com/gamedesignnotes/date/2016/04",
            value:
              "Launch description: DR 25% for 8s, Crit 25% for 6s; May 2020 patch reduces Crit to 15%, without settling current duration discrepancy.",
          }
        : {
            source: review.evidence.source,
            publishedAt: flight ? "2020-05-15" : "2021-12-20",
            value: review.evidence.excerpt,
            snapshot: review.evidence.snapshotPath,
            snapshotHash: review.evidence.snapshotHash,
          },
      community: {
        source: guide,
        value: flight
          ? "Existing guide text: +50% DoT, stale versus official 2020 patch."
          : veil
            ? "Existing guide text: Crit 7s, resistance 9s."
            : "Guide sequences time the Quantum Spiral fades event; no independent numeric duration in the reviewed Quantum Shift entry. Sequences preserved.",
      },
      checkedAt: "2026-11-11",
      status: veil ? "UNRESOLVED" : "RESOLVED",
      confidence: veil ? "low" : flight ? "high" : "medium",
      decision: veil
        ? "Retain verified buff amounts; omit disputed duration from player effect rows. Preserve both durations in metadata."
        : flight
          ? "Use +75% DoT, confirmed by explicit official 50 → 75 patch and current Wiki description."
          : "Use corroborated 23s for both active and passive views; preserve original 20s description and review rationale.",
      reason: veil
        ? "A launch-era 2016 description cannot establish current server aura expiry. Wiki Notes and guide differ by one second from description; no authoritative current timing clarification found."
        : review.evidence.rationale,
      freshnessReview: [
        "https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515",
        "https://www.aq.com/gamedesignnotes/aqw-classbalance-patchnotes-8927",
      ],
    };
  });
// The actual archived balance URL is the one embedded in the fetched source, if canonical differs.
const archived = fs
  .readFileSync("content-sources/v12-11/balance2024.html", "utf8")
  .match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
for (const c of conflicts)
  if (archived) c.freshnessReview[1] = archived.replace(/^http:/, "https:");
fs.writeFileSync(
  "src/content/classes/source-conflicts-v12-11.json",
  JSON.stringify(conflicts, null, 2) + "\n",
);
const lines = [
  "# V12.11 Source Conflicts",
  "",
  "Ngày đối chiếu: 2026-11-11. Bốn record ban đầu tương ứng ba cơ chế; hai Quantum variants cùng vấn đề thời lượng. Không gộp mất provenance riêng của từng profile.",
  "",
];
for (const c of conflicts) {
  lines.push(
    `<a id="${c.id}"></a>`,
    "## " + c.className + " — " + c.skillName,
    "",
    `- Identity: ${c.classId}/${c.skillId}`,
    `- Field: ${c.field}`,
    `- Initial website evidence: ${JSON.stringify(c.currentWebsiteValue)}`,
    `- Wiki description: ${c.wiki.description}; Wiki Notes/passive: ${c.wiki.notes}.`,
    ...c.wiki.sources.map((s) => `- Wiki: ${s}`),
    `- Official: ${c.official.source} — ${c.official.value} (publication: ${c.official.publishedAt || "April 2016 launch archive / May 2020 balance change"}).`,
    `- Docs/community: ${c.community.source} — ${c.community.value}`,
    `- Decision: **${c.status}**, confidence ${c.confidence}. ${c.decision}`,
    `- Reason: ${c.reason}`,
    "- Reviewed balance histories: " + c.freshnessReview.join(" · "),
    "",
  );
}
lines.push(
  "## Additional acquisition discrepancies discovered",
  "",
  "These are not counted as new entries in the original four skill conflicts. They remain linked to their Acquisition queue entries.",
  "",
  "- DeathKnight Lord: Class page lists DeathKnight Lord Armor without quantity plus Shadow Skull ×30. Bonecastle Merge row lists only Shadow Skull ×30; Bonecastle Tower Merge lists the Armor rather than the Class. Do not invent an Armor quantity or pretend the Tower shop sells the Class.",
  "- Necromancer (PTR): historical Class page points to PTR Enhancements, but the current PTR Enhancements page lists enhancement tables rather than the Class. Preserve its legacy purchase record as partial; do not present it as a current Shop.",
);
fs.writeFileSync("V12_11_SOURCE_CONFLICTS.md", lines.join("\n") + "\n");

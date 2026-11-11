import fs from "node:fs";
import { materialId } from "../src/lib/material-requirements.mjs";
const catalog = JSON.parse(fs.readFileSync("src/content/classes/catalog.json")),
  data = JSON.parse(fs.readFileSync("src/content/classes/acquisition.json"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
for (const c of catalog) {
  const file = "public" + c.bodyUrl,
    body = JSON.parse(fs.readFileSync(file));
  const acquisition = structuredClone(
    data.classes[c.id] || {
      classId: c.id,
      methods: [],
      reviewStatus: "partial",
      reviewedPages: [],
      issues: [
        {
          source: "https://aqwwiki.wikidot.com/classes",
          reason: "Class acquisition not yet reviewed",
        },
      ],
    },
  );
  for (const m of acquisition.methods) {
    // Curated progression belongs only to a source-explicit unlock requirement,
    // never to all alternative purchase methods for this Class.
    if (
      m.shop &&
      body.obtainSteps.length > 1 &&
      body.obtainSteps.some((step) =>
        m.prerequisites.some(
          (requirement) =>
            requirement.includes("'" + step.title + "'") ||
            requirement.includes("“" + step.title + "”"),
        ),
      )
    ) {
      m.unlockSteps = body.obtainSteps;
      m.unlockUseLegacyProgressKey = true;
    }
    if (!m.quest) continue;
    const verified = m.quest.verifiedQuestSteps || [];
    const legacy =
      verified.length > 0 &&
      verified.every((step) =>
        body.obtainSteps.some((old) => norm(old.title) === norm(step.name)),
      );
    if (verified.length) {
      const ids = verified.map((step) =>
        legacy
          ? body.obtainSteps.find((old) => norm(old.title) === norm(step.name))
              .id
          : "wiki-quest-" + materialId(step.name),
      );
      m.quest.useLegacyProgressKey = legacy;
      m.quest.steps = verified.map((step, i) => {
        const old = legacy
          ? body.obtainSteps.find((old) => norm(old.title) === norm(step.name))
          : null;
        return {
          ...old,
          id: ids[i],
          stepNumber: i + 1,
          title: step.name,
          description:
            old?.description ||
            "Điều kiện và nguyên liệu của đúng quest trên Wiki.",
          npc: old?.npc || m.quest.npc || undefined,
          map: old?.map || m.quest.map || undefined,
          requirement: step.prerequisites,
          materialTree: step.materials || undefined,
          reward: step.reward,
          repeatable: old?.repeatable || false,
          source: step.source,
          dependencies: i ? [ids[i - 1]] : [],
        };
      });
    }
    delete m.quest.verifiedQuestSteps;
  }
  body.acquisition = acquisition;
  fs.writeFileSync(file, JSON.stringify(body) + "\n");
}
console.log(
  `Structured acquisition applied to ${catalog.length} Class bodies; original skills/assets untouched.`,
);

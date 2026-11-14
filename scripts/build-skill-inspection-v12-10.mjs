import { applyCalendarItemScope } from "./lib/calendar-item-scope.mjs";
import fs from "node:fs";
import { applySkillRecovery } from "./lib/verification-v12-11.mjs";
import { Window } from "happy-dom";
import {
  parseRangeTarget,
  translateStatEffect,
  isTechnicalPlaceholder,
} from "./lib/skill-inspection-v12-10.mjs";
import { targetEffects } from "../src/lib/class-ui-v12-8.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p)),
  catalog = read("src/content/classes/catalog.json"),
  registry = read("src/content/classes/skill-registry.json"),
  audit = [];
const hasVietnamese = (text) => /[à-ỹđ]/i.test(text || "");
const isLocalizedGuideEffect = (text) =>
  hasVietnamese(text) ||
  /\b(?:trong|khi)\b/.test(text) ||
  /^(?:Self|Enemy|Enemies|Allies|Ally)(?:\s*\/\s*(?:Self|Ally))?\s+[+−-]?\d/i.test(
    text,
  );
const classGuide = read("content-sources/class-guide.json");
const guideSource =
  "https://docs.google.com/document/d/" + classGuide.source.id + "/edit";
const guideLines = new Map(
  classGuide.nodes.map((n) => [
    n.sourceIndex,
    n.runs
      ?.map((run) => run.text)
      .join("")
      .trim(),
  ]),
);
const targetRows = {
  shaman: [8308],
  "skycharged-grenadier-scg": [8364, 8371, 8379, 8388, 8396],
  "not-a-mod-nam": [12038, 12046, 12063, 12073],
  "paladinslayer-ps": [12133],
  "calendar-chrono-chaorruptor": [9941, 9949, 9956, 9965, 9973],
  "calendar-chronocorruptor": [9941, 9949, 9956, 9965, 9973],
  "calendar-chrono-dataknight": [10168, 10177, 10184, 10192, 10200],
  "calendar-chrono-dragonknight": [10168, 10177, 10184, 10192, 10200],
};
const normalize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const baseAutoAttack =
  /^(?:(?:Double click a monster to start Auto Attacking it\. This is a|A) basic attack, taught to all (?:adventurers|Pyromancers)\.|A strong attack known only to disciplined fighters\.|A rapid attack studied (?:only by|by only) a reclusive few\.) (?:Damage dealt is based on (?:your )?weapon damage|Deals damage based on your weapon damage)\.$/i;
const specialReviews = new Map(
  read("src/content/classes/reviewed-special-effects.json").map((row) => [
    row.classId + "/" + row.skillId,
    row,
  ]),
);
const activeReviews = new Map(
  read("src/content/classes/reviewed-active-effects.json").map((row) => [
    JSON.stringify([row.name, row.description, row.notes]),
    row,
  ]),
);
const passiveReviews = new Map(
  read("src/content/classes/reviewed-passive-effects.json").map((row) => [
    JSON.stringify(row.fields),
    row.effects,
  ]),
);
for (const c of catalog) {
  const file = "public" + c.bodyUrl,
    b = read(file);
  let autoSpecial = false;
  const page = registry.classes[c.id]?.sourceUrl;
  if (page) {
    const path =
      "content-sources/class-wiki/" + new URL(page).pathname.slice(1) + ".html";
    if (fs.existsSync(path)) {
      const w = new Window();
      w.document.write(fs.readFileSync(path, "utf8"));
      const start = [
        ...w.document.querySelectorAll("#page-content strong"),
      ].find((e) => /^Special Effects?:$/i.test(e.textContent.trim()));
      const parent = start?.parentElement;
      let str = parent?.textContent.split(/Skills:/)[0] || "";
      if (parent?.nextElementSibling?.matches("ul"))
        str += parent.nextElementSibling.textContent;
      autoSpecial = /auto.?attack/i.test(str);
      await w.happyDOM.close();
    }
  }
  const classRecords = registry.skills.filter(
    (record) => record.classId === c.id,
  );
  autoSpecial ||= classRecords.some(
    (record) =>
      record.passive &&
      /auto.?attacks?|your autos|every attack|all (?:skills|attacks)/i.test(
        record.officialDescription || "",
      ),
  );
  for (const s of b.skills) {
    const r = classRecords.find((record) => record.skillId === s.id),
      snapshot = { ...s };
    delete snapshot.effects;
    delete s.effects;
    s.rangeSourceText = r?.target || null;
    const parsed = parseRangeTarget(r?.target);
    s.rangeCategory = s.passive ? null : parsed.rangeCategory;
    const docLine = (targetRows[c.id] || []).find(
      (line) => normalize(guideLines.get(line) || "") === normalize(s.name),
    );
    const guideTarget = guideLines
      .get(docLine + 2)
      ?.match(/^(?:Phys|Magi|Hybr|True) - (?:(\d+) targets?|Yourself)$/);
    const documentedTarget = guideTarget ? Number(guideTarget[1] || 1) : null;
    s.targetCount = s.passive ? null : (parsed.targetCount ?? documentedTarget);
    s.rankRequired = s.rankRequirement ?? s.rank ?? null;
    s.cooldownSeconds = s.cooldown ?? null;
    s.skillType = s.effectType;
    s.statsEvidence = {
      source: r?.sourceUrl || s.source,
      sourceHash: r?.sourceHash || null,
      rangeVerification: parsed.rangeVerification,
      targetVerification:
        documentedTarget != null && parsed.targetCount == null
          ? "verified_class_guide"
          : parsed.targetVerification,
      targetSource:
        documentedTarget != null && parsed.targetCount == null
          ? guideSource
          : r?.sourceUrl,
      targetSourceLine:
        documentedTarget != null && parsed.targetCount == null
          ? docLine + 2
          : undefined,
    };
    let effects = [],
      status = "unverified";
    const official = [r?.officialDescription, ...(r?.wikiNotes || [])].filter(
      Boolean,
    );
    const translations = official.map(translateStatEffect);
    const reviewed = s.passive && passiveReviews.get(JSON.stringify(official));
    const specialReview = specialReviews.get(c.id + "/" + s.id);
    const exactReview =
      specialReview?.sourceHash === r?.sourceHash &&
      specialReview?.source === r?.sourceUrl
        ? specialReview
        : null;
    if (exactReview) {
      effects = exactReview.effects;
      status = "verified";
    } else if (reviewed) {
      effects = reviewed;
      status = "verified";
    } else if (s.passive && official.length && translations.every(Boolean)) {
      effects = translations.flat().map((text) => ({ targets: [], text }));
      status = "verified";
    } else if (
      s.name === "Chaos Bulwark" &&
      r?.sourceUrl === "https://aqwwiki.wikidot.com/chaos-avenger" &&
      r.officialDescription ===
        "Chaorrupt the raw energy around you and release a portion of it at your target, dealing damage while absorbing the remainder into your armor. Gain Chaotic Armor, healing you over time and granting you 60% defense for 15 seconds."
    ) {
      effects = [
        { targets: ["ENEMY"], text: "Gây sát thương lên mục tiêu." },
        {
          targets: ["SELF"],
          name: "Chaotic Armor",
          text: "Hồi máu theo thời gian và tăng 60% phòng thủ trong 15 giây.",
        },
      ];
      status = "verified";
    } else if (
      /^Auto Attack$/i.test(s.name) &&
      r?.verificationStatus === "verified" &&
      baseAutoAttack.test(r.officialDescription || "") &&
      !(r.wikiNotes || []).length &&
      !autoSpecial
    ) {
      effects = [];
      status = "verified_none";
      s.damageDisplay = "Sát thương cơ bản theo Weapon Damage.";
    } else if (
      !s.passive &&
      activeReviews.has(
        JSON.stringify([r?.officialName, r?.officialDescription, r?.wikiNotes]),
      )
    ) {
      const activeReview = activeReviews.get(
        JSON.stringify([r.officialName, r.officialDescription, r.wikiNotes]),
      );
      effects = activeReview.effects;
      status = activeReview.status;
    } else {
      const description = [s.description, ...s.usageNotes].filter(
        (t) => t && !isTechnicalPlaceholder(t),
      );
      const translated = description.filter(isLocalizedGuideEffect);
      if (translated.length) {
        effects = targetEffects({
          ...snapshot,
          description: translated[0],
          usageNotes: translated.slice(1),
        });
        status =
          translated.length === description.length
            ? "community"
            : "community_partial";
      }
    }
    s.effects = effects;
    s.effectsVerificationStatus = status;
    s.noAdditionalEffects = status === "verified_none";
    s.effectEvidence = {
      source: r?.sourceUrl || s.source,
      sourceHash: r?.sourceHash || null,
      description: r?.officialDescription || null,
      notes: r?.wikiNotes || [],
      reviewedSourceText: exactReview?.originalEffect,
      supportingSource: exactReview?.supportingSource,
      translationMethod:
        status === "verified"
          ? "Exact stat grammar or explicit source-bound reviewed translation"
          : status.startsWith("community")
            ? "Existing Vietnamese guide text retained"
            : "No complete Vietnamese effect translation verified",
    };
    if (s.damage && !s.damageDisplay && hasVietnamese(s.damage))
      s.damageDisplay = s.damage;
    if (s.healing && hasVietnamese(s.healing)) s.healingDisplay = s.healing;
    applySkillRecovery(c.id, s, r);
    applyCalendarItemScope(c.id, s);
    audit.push({
      classId: c.id,
      className: c.name,
      skillId: s.id,
      name: s.name,
      passive: !!s.passive,
      quarantined: !!s.quarantined,
      rangeCategory: s.rangeCategory,
      targetCount: s.targetCount,
      specialRange: !s.passive && parsed.special,
      targetEvidence: s.statsEvidence.targetSource,
      rawRange: r?.target || null,
      mana: s.manaCost ?? null,
      cooldown: s.cooldownSeconds,
      rank: s.rankRequired,
      effectStatus: s.effectsVerificationStatus,
      effectCount: s.effects.length,
      removedPlaceholder: isTechnicalPlaceholder(snapshot.description),
      source: r?.sourceUrl || null,
      sourceHash: r?.sourceHash || null,
      iconVerification: r?.verificationStatus,
      issues:
        !s.effects.length && s.effectsVerificationStatus !== "verified_none"
          ? ["Complete effect translation remains unverified"]
          : [],
    });
  }
  fs.writeFileSync(file, JSON.stringify(b) + "\n");
}
fs.mkdirSync("artifacts/qa/v12-10", { recursive: true });
fs.writeFileSync(
  "artifacts/qa/v12-10/skill-audit.json",
  JSON.stringify(audit, null, 2) + "\n",
);
console.log({
  classes: catalog.length,
  skills: audit.length,
  passives: audit.filter((s) => s.passive).length,
  verifiedPassiveEffects: audit.filter(
    (s) => s.passive && s.effectStatus === "verified",
  ).length,
  range: audit.filter((s) => !s.passive && s.rangeCategory).length,
  target: audit.filter((s) => !s.passive && s.targetCount != null).length,
});

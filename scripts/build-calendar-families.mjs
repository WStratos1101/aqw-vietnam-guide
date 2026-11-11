import fs from "node:fs";
import { normalizeCalendarMethods } from "../src/lib/calendar-acquisition.mjs";
import { parseClassPage } from "./lib/calendar-class-parser.mjs";
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const families = read("src/content/classes/calendar-families.json");
const profiles = read("src/content/classes/catalog.json");
const portraits = read("src/content/classes/portrait-registry.json");
const shadowArt = read("content-sources/v12-6/shadow-family-art.json");
const result = {};
const equivalence = read("src/content/classes/family-equivalence-reviews.json");
for (const family of families) {
  let reference;
  const review = equivalence.find(r=>r.id===family.id);
  const primaryProfile=profiles.find(c=>c.id===family.primaryClassId);
  const primaryBody=read("public"+primaryProfile.bodyUrl);
  for (const variant of family.variants) {
    const page = await parseClassPage(variant.source);
    const skills = page.entries.map(
      ({
        officialName,
        rank,
        skillType,
        manaCost,
        cooldown,
        target,
        officialDescription,
        notes,
      }) => ({
        officialName,
        rank,
        skillType,
        manaCost,
        cooldown,
        target,
        officialDescription,
        notes,
      }),
    );
    const reviewedSource=review?.sources.find(s=>s.url===variant.source);
    if(review && (!reviewedSource || reviewedSource.sourceHash!==page.sourceHash))throw Error("Family equivalence review invalidated by source change: "+variant.name);
    if (!skills.length || (reference && reference !== JSON.stringify(skills) && !review)) {
      throw Error("Calendar family source data differs: " + variant.name);
    }
    reference ??= JSON.stringify(skills);
    const profile = profiles.find((c) => c.id === variant.classId);
    const art =
      shadowArt.find((a) => a.slug === variant.id) ||
      portraits.find((a) => a.id === profile.image);
    if (!art || !fs.existsSync("public" + art.imagePath))
      throw Error("Missing variant art: " + variant.name);
    const body = read("public" + profile.bodyUrl);
    const record = body.acquisition;
    const methods =
      record?.methods.filter((method) => method.source === variant.source ||
        method.variantName.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase() === variant.name.toLowerCase()) ||
      [];
    const skillNameOverrides=[];
    if(review){
      for(const skill of body.skills.filter(s=>!s.quarantined)){
        const canonical=primaryBody.skills.find(s=>s.name===(review.aliases[skill.name]||skill.name));
        if(!canonical)throw Error("No named canonical skill for "+skill.name);
        if(skill.name!==canonical.name)skillNameOverrides.push({skillId:canonical.id,variantSkillId:skill.id,name:skill.name,source:variant.source});
      }
    }
    result[variant.id] = {
      skillNameOverrides,
      familyId:family.id,
      portrait: {
        imagePath: art.imagePath,
        width: art.width,
        height: art.height,
        source: art.source || art.sourceUrl,
      },
      acquisition: record ? { ...record, methods: normalizeCalendarMethods(methods) } : null,
      sourceHash: page.sourceHash,
    };
  }
}
fs.writeFileSync(
  "src/content/classes/calendar-variant-runtime.json",
  JSON.stringify(result, null, 2) + "\n",
);

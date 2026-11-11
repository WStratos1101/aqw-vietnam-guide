import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Window } from "happy-dom";
const exec = promisify(execFile),
  dir = "content-sources/class-wiki",
  output = "src/content/classes/skill-registry.json";
await fs.mkdir(dir, { recursive: true });
await fs.mkdir("public/images/aqw/class-skills", { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const read = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const catalog = await read("src/content/classes/catalog.json");
const corrections = await read("src/content/classes/name-corrections.json");
const reconciliation = await read(
  "src/content/classes/current-skill-reconciliation.json",
);
const selectedCatalog = process.env.AQW_ICON_CLASSES
  ? catalog.filter((c) =>
      process.env.AQW_ICON_CLASSES.split(",").includes(c.id),
    )
  : catalog;
const index = await read(dir + "/index-links.json");
const norm = (s) =>
  s
    .normalize("NFKD")
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const clean = (s) => s.replace(/\([^)]*\)/g, "").trim();
const overrides = {
  "chaos-slayer-cs-chaos-champion-prime-ccp": [
    "Chaos Slayer Berserker",
    "Chaos Slayer Cleric",
    "Chaos Champion Prime",
  ],
  "artifact-antique-hunter-ah": ["Artifact Hunter", "Antique Hunter"],
  "battlemage-dark-royal-battlemage-dbm-rbm": [
    "BattleMage",
    "Dark BattleMage",
    "Royal BattleMage",
  ],
  "berserker-beta-berserker-brutal-berserker": [
    "Berserker",
    "Beta Berserker",
    "Brutal Berserker",
  ],
  "dragon-drakkar-draco-knight-drk": [
    "Dragon Knight",
    "Drakkar Knight",
    "Draco Knight",
  ],
  "dragon-dragonsoul-shadow-dragon-shinobi-dss-sds": [
    "Dragon Shinobi",
    "Dragonsoul Shinobi",
    "Shadow Dragon Shinobi",
  ],
  "glacial-glaceran-warlord-dark-savage-glaceran-warlord-gw-dgw-sgw": [
    "Glacial Warlord",
    "Glaceran Warlord",
    "Dark Glaceran Warlord",
    "Savage Glaceran Warlord",
  ],
  "legendary-ultra-mythic-elemental-warrior-lew-uew-mew": [
    "Legendary Elemental Warrior",
    "Ultra Elemental Warrior",
    "Mythic Elemental Warrior",
  ],
  "prismatic-evolved-clawsuit-pcs-ecs": [
    "Prismatic ClawSuit",
    "Evolved ClawSuit",
  ],
  "exalted-soul-cleaver-esc-exalted-dark-harbinger-eh-dh": [
    "Exalted Soul Cleaver",
    "Exalted Harbinger",
    "Dark Harbinger",
  ],
  "shadowwalker-stalker-weaver-of-time-swot-ssot": [
    "ShadowWalker of Time",
    "ShadowStalker of Time",
    "ShadowWeaver of Time",
  ],
  "eternal-immortal-empyrean-chronomancer-ecm-icm": [
    "Eternal Chronomancer",
    "Immortal Chronomancer",
    "Empyrean Chronomancer",
  ],
  "infinity-interstellar-knight-ik": ["Infinity Knight", "Interstellar Knight"],
  "phantom-phantasm-chronomancer-phcm": [
    "Phantom Chronomancer",
    "Phantasm Chronomancer",
  ],
  "archivist-of-time-temporis-aot": [
    "Archivist of Time",
    "Archivist of Temporis",
  ],
  "master-of-moglins-mom-dark-master-of-moglins-dmom": [
    "Master of Moglins",
    "Dark Master of Moglins",
  ],
  "naval-commander-nc-heroic-legendary-naval-commander-hnc-lnc": [
    "Naval Commander",
    "Heroic Naval Commander",
    "Legendary Naval Commander",
  ],
  "ultra-omniknight-uok-dark-ultra-omninight-duon": [
    "Ultra OmniKnight",
    "Dark Ultra OmniKnight",
  ],
  "vampire-lord-vl-enchanted-royal-vampire-lord-evl-rvl": [
    "Vampire Lord",
    "Enchanted Vampire Lord",
    "Royal Vampire Lord",
  ],
};
let registry;
try {
  registry = await read(output);
} catch {
  registry = {
    version: 1,
    policy: {
      url: "https://www.artix.com/community/brand-and-assets-usage/",
      usage:
        "Noncommercial fan guide; Artix credit and links required. No endorsement. Wiki text CC BY-SA 3.0 is not an image licence.",
    },
    classes: {},
    skills: [],
    assets: [],
  };
}
const noNetwork = process.argv.includes("--cached-only");
const batch = Number(process.env.AQW_ICON_BATCH || 10);
const limit = Number(process.env.AQW_ICON_LIMIT || catalog.length);
async function download(url, file) {
  try {
    const b = await fs.readFile(file);
    if (b.length > 100) return b;
  } catch {}
  if (noNetwork) throw Error("Source not cached");
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = file + ".download";
  try {
    await exec(
      "curl",
      [
        "-fsSL",
        "--retry",
        "2",
        "--retry-all-errors",
        "--retry-delay",
        "1",
        "--connect-timeout",
        "10",
        "--max-time",
        "35",
        "-o",
        temp,
        url,
      ],
      { maxBuffer: 2048 },
    );
    const b = await fs.readFile(temp);
    if (b.length < 100) throw Error("Empty download");
    await fs.rename(temp, file);
    return b;
  } catch (e) {
    await fs.rm(temp, { force: true });
    throw Error(e.stderr?.trim() || e.message);
  }
}
function dimensions(b) {
  if (
    b.subarray(0, 4).toString() === "RIFF" &&
    b.subarray(8, 12).toString() === "WEBP"
  ) {
    const type = b.subarray(12, 16).toString();
    if (type === "VP8L" && b[20] === 47) {
      const bits = b.readUInt32LE(21);
      return {
        width: (bits & 16383) + 1,
        height: ((bits >>> 14) & 16383) + 1,
        extension: "webp",
      };
    }
    if (type === "VP8X")
      return {
        width: b.readUIntLE(24, 3) + 1,
        height: b.readUIntLE(27, 3) + 1,
        extension: "webp",
      };
  }
  if (b.subarray(1, 4).toString() === "PNG")
    return {
      width: b.readUInt32BE(16),
      height: b.readUInt32BE(20),
      extension: "png",
    };
  if (b.subarray(0, 3).toString() === "GIF")
    return {
      width: b.readUInt16LE(6),
      height: b.readUInt16LE(8),
      extension: "gif",
    };
  return null;
}
async function parsePage(url) {
  const slug = new URL(url).pathname.slice(1),
    file = dir + "/" + slug + ".html";
  const bytes = await download(url, file),
    w = new Window();
  w.document.write(bytes.toString());
  const d = w.document.querySelector("#page-content");
  if (!d) {
    await w.happyDOM.close();
    throw Error("Not a Wiki content page");
  }
  const entries = [];
  for (const el of d.querySelectorAll(".collapsible-block-content")) {
    if (
      el.querySelector(".collapsible-block-content") ||
      !el.textContent.includes("Rank Needed:")
    )
      continue;
    const name =
      el.querySelector("p strong span")?.textContent.trim() ||
      el.querySelector("p strong")?.textContent.trim();
    if (!name) continue;
    const text = el.textContent
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const images = [
      ...new Set(
        [...el.querySelectorAll("img")].map((i) => i.getAttribute("src")),
      ),
    ].filter(
      (s) =>
        s &&
        !/(?:acsmall|aclarge|legend|rare|seasonal|member|staffbirthday)\.(?:png|gif)/i.test(
          s,
        ),
    );
    const fields = {};
    for (const strong of el.querySelectorAll("p > strong")) {
      const key = strong.textContent.replace(/:$/, "").trim();
      let value = "";
      for (
        let n = strong.nextSibling;
        n && n.nodeName !== "BR" && n.nodeName !== "STRONG";
        n = n.nextSibling
      )
        value += n.textContent;
      fields[key] = value.trim();
    }
    entries.push({
      officialName: name,
      manaCostDisplay: fields["Mana Cost"] || null,
      cooldownDisplay: fields.Cooldown || null,
      rank: Number(fields["Rank Needed"]?.match(/\d+/)?.[0] ?? NaN),
      passive: /passive|rank 10/i.test(fields.Type || ""),
      manaCost: fields["Mana Cost"]?.match(/^\d+(?:\.\d+)?/)?.[0],
      cooldown: fields.Cooldown?.match(/^\d+(?:\.\d+)?/)?.[0],
      skillType: fields.Type || null,
      target: fields.Range || null,
      officialDescription: fields.Description || null,
      notes: [...el.querySelectorAll("li")].map((e) => e.textContent.trim()),
      iconUrl:
        images.length === 1
          ? new URL(images[0], url).href.replace(/^http:/, "https:")
          : null,
      sourceUrl: url,
      sourceHash: hash(bytes),
      evidence: text,
    });
  }
  // Portrait must be in this exact Class page's Male/Female artwork tabs, outside skill blocks.
  const tab = [...d.querySelectorAll(".yui-navset")].find(
    (n) =>
      /Male/.test(n.querySelector(".yui-nav")?.textContent || "") &&
      /Female/.test(n.querySelector(".yui-nav")?.textContent || ""),
  );
  const portrait = tab?.querySelector(".yui-content img")?.getAttribute("src");
  const related = [...d.querySelectorAll("li")].find((li) =>
    /^This class has the same skills as/i.test(li.textContent.trim()),
  );
  const result = {
    url,
    sourceHash: hash(bytes),
    entries,
    portraitUrl: portrait
      ? new URL(portrait, url).href.replace(/^http:/, "https:")
      : null,
    sameSkillVariants: related
      ? [...related.querySelectorAll("a")].map((a) => ({
          name: a.textContent,
          url: new URL(a.getAttribute("href"), url).href,
        }))
      : [],
    location: d.textContent.split("Sellback:")[0].trim(),
  };
  await w.happyDOM.close();
  return result;
}
async function materialize(record, entry) {
  if (!entry.iconUrl)
    return {
      ...record,
      verificationStatus: "manual_review",
      issue: "Named skill has zero or multiple candidate icons",
    };
  const cache = dir + "/asset-cache/" + hash(entry.iconUrl);
  const bytes = await download(entry.iconUrl, cache);
  const size = dimensions(bytes);
  if (
    !size ||
    size.width > 512 ||
    size.height > 512 ||
    size.width < 8 ||
    size.height < 8
  )
    throw Error(
      "Icon bytes/dimensions invalid; not silently accepting HTML or unrelated large art",
    );
  const digest = hash(bytes),
    assetId = "skill-icon-" + digest.slice(0, 20),
    imagePath =
      "/images/aqw/class-skills/" + digest.slice(0, 24) + "." + size.extension;
  await fs.writeFile("public" + imagePath, bytes);
  if (!registry.assets.some((a) => a.id === assetId))
    registry.assets.push({
      id: assetId,
      imagePath,
      sourceUrl: entry.iconUrl,
      sha256: digest,
      width: size.width,
      height: size.height,
      usageStatus: "approved_noncommercial",
      policyUrl: registry.policy.url,
      credit: "AdventureQuest Worlds artwork © Artix Entertainment LLC",
    });
  return {
    ...record,
    iconAssetId: assetId,
    verificationStatus: "verified",
    usageStatus: "approved_noncommercial",
    sourceUrl: entry.sourceUrl,
    sourceHash: entry.sourceHash,
    officialName: entry.officialName,
    rankRequirement: Number.isFinite(entry.rank) ? entry.rank : null,
    skillType: entry.skillType,
    passive: entry.passive,
    manaCostDisplay: entry.manaCostDisplay,
    cooldownDisplay: entry.cooldownDisplay,
    manaCost: entry.manaCost == null ? null : Number(entry.manaCost),
    cooldown: entry.cooldown == null ? null : Number(entry.cooldown),
    target: entry.target,
    officialDescription: entry.officialDescription,
    wikiNotes: entry.notes,
    evidence: {
      method:
        "exact normalized name inside named .skills disclosure; image in same skill block",
      name: entry.officialName,
      iconUrl: entry.iconUrl,
      sourcePage: entry.sourceUrl,
      sourceHash: entry.sourceHash,
    },
    verifiedAt: "2026-11-09",
  };
}
async function processClass(c) {
  const body = await read("public" + c.bodyUrl);
  let names =
    overrides[c.id] ||
    c.name.split(" - ").map((n) => clean(n).split("/")[0].trim());
  const explicit = c.sources.filter((s) => s.type === "wiki").map((s) => s.url);
  const candidates = [
    ...explicit,
    ...names.flatMap((name) =>
      index
        .filter((a) => norm(clean(a.name)) === norm(name))
        .sort((a, b) => a.name.length - b.name.length)
        .map((a) => a.url),
    ),
  ];
  const unique = [...new Set(candidates)];
  let page,
    errors = [];
  for (const url of unique) {
    try {
      page = await parsePage(url);
      if (page.entries.length) break;
      errors.push(url + ": no named skill blocks");
    } catch (e) {
      errors.push(url + ": " + e.message);
    }
  }
  if (page && !page.entries.length) page = null;
  const meta = {
    verifiedVariantPages:registry.classes[c.id]?.verifiedVariantPages||[],
    classId: c.id,
    name: c.name,
    candidateUrls: unique,
    sourceUrl: page?.url || null,
    sourceHash: page?.sourceHash || null,
    sameSkillVariants: page?.sameSkillVariants || [],
    portraitUrl: page?.portraitUrl || null,
    location: page?.location || null,
    status: page?.entries.length ? "source_read" : "manual_review",
    errors,
  };
  if (page) {
    await fs.writeFile(
      dir + "/" + c.id + ".parsed.json",
      JSON.stringify(page, null, 2),
    );
  }
  const alternatePages = new Map();
  for (const s of body.skills) {
    const old = registry.skills.find(
      (r) => r.classId === c.id && r.skillId === s.id,
    );
    if (old?.quarantined) continue;
    if (
      old?.verificationStatus === "verified" &&
      old.evidence &&
      registry.assets.some((a) => a.id === old.iconAssetId) &&
      (await fs
        .access(
          "public" +
            registry.assets.find((a) => a.id === old.iconAssetId).imagePath,
        )
        .then(
          () => true,
          () => false,
        ))
    )
      continue;
    let record = {
      classId: c.id,
      skillId: s.id,
      importedName: s.name,
      importedPassive: !!s.passive,
      importedSlot: s.skillNumber ?? null,
      verificationStatus: "manual_review",
      issue: !page
        ? "Class source unavailable"
        : "Official skill name not matched; variant or old name requires review",
      candidateUrls: unique,
    };
    const correction = corrections.find(
      (x) => x.classId === c.id && x.skillId === s.id && x.from === s.name,
    );
    if (correction) record.nameCorrection = correction;
    let matches =
      page?.entries.filter(
        (e) => norm(e.officialName) === norm(correction?.to || s.name),
      ) || [];
    if (matches.length === 0 && page)
      for (const url of unique.filter((url) => url !== page.url)) {
        let alt = alternatePages.get(url);
        if (alt === undefined) {
          try {
            alt = await parsePage(url);
          } catch {
            alt = null;
          }
          alternatePages.set(url, alt);
        }
        const found =
          alt?.entries.filter(
            (e) => norm(e.officialName) === norm(correction?.to || s.name),
          ) || [];
        if (found.length === 1) {
          matches = found;
          meta.verifiedVariantPages = [
            ...(meta.verifiedVariantPages || []).filter((p) => p.url !== url),
            {
              url,
              sourceHash: alt.sourceHash,
              relation: page.sameSkillVariants.some((v) => v.url === url)
                ? "Wiki declares same skills"
                : "Named variant in this profile; matched independently, no assumption of identical skill sets",
            },
          ];
          break;
        }
      }
    if (matches.length === 1) {
      try {
        record = await materialize(record, matches[0]);
      } catch (e) {
        record = {
          ...record,
          sourceUrl: page.url,
          issue: "Icon fetch/validation failed: " + e.message,
          evidence: {
            name: matches[0].officialName,
            iconUrl: matches[0].iconUrl,
            sourcePage: page.url,
          },
        };
      }
    } else if (matches.length > 1)
      record.issue =
        "Ambiguous exact skill name; state/variant needs explicit mapping";
    const i = registry.skills.findIndex(
      (r) => r.classId === c.id && r.skillId === s.id,
    );
    if (i >= 0) registry.skills[i] = record;
    else registry.skills.push(record);
  }
  if (
    page &&
    (process.argv.includes("--include-passives") ||
      process.argv.includes("--include-current-actives"))
  )
    for (const e of page.entries.filter(
      (e) =>
        (e.passive && process.argv.includes("--include-passives")) ||
        (!e.passive &&
          process.argv.includes("--include-current-actives") &&
          reconciliation[c.id]?.currentActiveNames.includes(e.officialName)),
    )) {
      if (body.skills.some((s) => norm(s.name) === norm(e.officialName)))
        continue;
      const skillId =
        (e.passive ? "wiki-passive-" : "wiki-active-") + norm(e.officialName);
      const previous = registry.skills.find(
        (r) => r.classId === c.id && r.skillId === skillId,
      );
      if (previous?.verificationStatus === "verified") continue;
      const record = {
        classId: c.id,
        skillId,
        importedName: e.officialName,
        importedPassive: e.passive,
        importedSlot: null,
        supplemental: true,
        supplementalKind: e.passive ? "passive" : "current_active",
        verificationStatus: "manual_review",
      };
      try {
        const value = await materialize(record, e);
        const i = registry.skills.findIndex(
          (r) => r.classId === c.id && r.skillId === skillId,
        );
        if (i >= 0) registry.skills[i] = value;
        else registry.skills.push(value);
      } catch (error) {
        record.issue = error.message;
        const i = registry.skills.findIndex(
          (r) => r.classId === c.id && r.skillId === skillId,
        );
        if (i >= 0) registry.skills[i] = record;
        else registry.skills.push(record);
      }
    }
  registry.classes[c.id] = meta;
  console.log(
    c.id +
      ": " +
      registry.skills.filter(
        (r) => r.classId === c.id && r.verificationStatus === "verified",
      ).length +
      "/" +
      body.skills.length,
  );
}
async function save() {
  registry.updatedAt = new Date().toISOString();
  await fs.writeFile(output, JSON.stringify(registry, null, 2) + "\n");
  const verified = registry.skills.filter(
    (s) => s.verificationStatus === "verified",
  ).length;
  await fs.writeFile(
    "artifacts/qa/icon-progress.json",
    JSON.stringify(
      {
        classSourcesProcessed: Object.keys(registry.classes).length,
        skillsProcessed: registry.skills.length,
        originalSkillsReviewed: registry.skills.filter((s) => !s.supplemental)
          .length,
        originalVerified: registry.skills.filter(
          (s) => !s.supplemental && s.verificationStatus === "verified",
        ).length,
        supplementalVerified: registry.skills.filter(
          (s) => s.supplemental && s.verificationStatus === "verified",
        ).length,
        verified,
        needsReview: registry.skills.length - verified,
        uniqueAssets: registry.assets.length,
      },
      null,
      2,
    ) + "\n",
  );
}
for (
  let start = 0;
  start < Math.min(limit, selectedCatalog.length);
  start += batch
) {
  const group = selectedCatalog.slice(start, Math.min(start + batch, limit));
  for (let i = 0; i < group.length; i += 2)
    await Promise.allSettled(group.slice(i, i + 2).map(processClass)).then(
      async (results) => {
        for (const r of results)
          if (r.status === "rejected") console.error(r.reason);
        await save();
      },
    );
  await exec(process.execPath, ["scripts/normalize-class-skill-fields.mjs"]);
  registry = await read(output);
  await exec(process.execPath, ["scripts/apply-class-codex.mjs"]);
  await exec(process.execPath, ["scripts/validate-class-icons.mjs"]).catch(
    (e) => {
      console.error(e.stdout || e.message);
      throw e;
    },
  );
  await exec(process.execPath, ["--test", "tests/class-codex.test.mjs"]);
  if (
    await fs.access("artifacts/qa/checks.json").then(
      () => true,
      () => false,
    )
  )
    await exec(process.execPath, ["scripts/audit-v12-1.mjs"]);
  console.log("Saved, audited & validated batch " + (start / batch + 1));
}
await save();

await exec(process.execPath, ["scripts/normalize-class-skill-fields.mjs"]);

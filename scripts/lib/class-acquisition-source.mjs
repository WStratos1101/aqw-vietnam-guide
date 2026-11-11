import { Window } from "happy-dom";
import { createHash } from "node:crypto";
import {
  item,
  parseMaterialLines,
  validateMaterials,
} from "../../src/lib/material-requirements.mjs";
export const sourceHash = (text) =>
  createHash("sha256").update(text).digest("hex");
const text = (el) => el?.textContent?.replace(/\s+/g, " ").trim() || "";
function field(d, label) {
  const strong = [...d.querySelectorAll("strong")].find(
    (e) =>
      !e.closest(".skills,.collapsible-block-content") &&
      new RegExp("^(?:" + label + "):$", "i").test(text(e)),
  );
  if (!strong) return null;
  let content = "";
  const links = [];
  for (
    let n = strong.nextSibling;
    n &&
    n.nodeName !== "BR" &&
    !(n.nodeName === "STRONG" && /:$/.test(text(n)));
    n = n.nextSibling
  ) {
    content += n.textContent || "";
    if (n.nodeType === 1) {
      if (n.matches("a[href]")) links.push(n);
      links.push(...n.querySelectorAll("a[href]"));
    }
  }
  return { value: content.replace(/\s+/g, " ").trim(), strong, links };
}
const linkData = (a, url) => ({
  name: text(a).replace(/^['‘’"]|['‘’"]$/g, ""),
  url: new URL(a.getAttribute("href"), url).href.replace(/^http:/, "https:"),
});
export function parsePrice(value) {
  if (!value) return null;
  const m = value.match(/^([\d,]+)\s+(ACs?|Gold)(?:\s*\([^)]*\))?$/i);
  if (!m) return null;
  const amount = Number(m[1].replaceAll(",", ""));
  return Number.isSafeInteger(amount) && amount >= 0
    ? { amount, currency: /^ac/i.test(m[2]) ? "AC" : "Gold", sourceText: value }
    : null;
}
function materialTree(ul, source) {
  if (!ul)
    return { tree: null, rows: [], issue: "No structured material list found" };
  const rows = [...ul.children].filter((n) => n.nodeName === "LI").map(text);
  if (!rows.length) return { tree: null, rows, issue: "Empty material list" };
  // A standalone operator loses its scope if flattened; keep it pending, never make an OR item.
  if (rows.some((row) => /^(OR|AND)$/i.test(row)))
    return {
      tree: null,
      rows,
      issue: "Standalone material operator requires explicit branch review",
    };
  const nodes = [];
  for (const li of [...ul.children].filter((n) => n.nodeName === "LI")) {
    const nested = li.querySelector(":scope > ul");
    const own = li.cloneNode(true);
    own.querySelectorAll(":scope > ul").forEach((n) => n.remove());
    const ownValue = text(own);
    const informational =
      nested &&
      [...nested.children].every((n) => /^Dropped by(?:\s|:)/i.test(text(n)));
    if (nested && !informational) {
      if (/(?:one|any) of the following/i.test(text(li.firstChild))) {
        const branch = materialTree(nested, source);
        if (!branch.tree) return { tree: null, rows, issue: branch.issue };
        nodes.push({
          kind: "anyOf",
          requiredChoices: 1,
          requirements: branch.tree.requirements,
        });
        continue;
      }
      return {
        tree: null,
        rows,
        issue: "Nested material scope requires review",
      };
    }
    const value = informational ? ownValue : text(li);
    if (/\s(?:OR|AND)\s/.test(value)) {
      const parsed = parseMaterialLines(value, source);
      if (!parsed.tree) return { tree: null, rows, issue: parsed.reason };
      nodes.push(...parsed.tree.requirements);
      continue;
    }
    const m = value.match(/^(.*?)\s*[x×]\s*([\d,]+)$/);
    if (!m)
      return {
        tree: null,
        rows,
        issue: "Material quantity not explicit: " + value,
      };
    const link = [...li.querySelectorAll("a[href]")].find(
      (a) => text(a) === m[1],
    );
    const material = item(
      m[1],
      Number(m[2].replaceAll(",", "")),
      link
        ? new URL(link.getAttribute("href"), source).href.replace(
            /^http:/,
            "https:",
          )
        : source,
    );
    if (informational)
      material.acquisitionSources = [...nested.querySelectorAll("a[href]")].map(
        (a) => linkData(a, source),
      );
    nodes.push(material);
  }
  const tree = { kind: "allOf", requirements: nodes };
  const errors = validateMaterials(tree);
  return { tree: errors.length ? null : tree, rows, issue: errors.join("; ") };
}
export async function parseClassAcquisitionPage(html, url) {
  const w = new Window();
  w.document.write(html);
  const d = w.document.querySelector("#page-content");
  if (!d) {
    await w.happyDOM.close();
    throw Error("No Wiki page content");
  }
  const title =
    text(w.document.querySelector("#page-title")) ||
    new URL(url).pathname.slice(1);
  const location = field(d, "Locations?"),
    price = field(d, "Price"),
    base = field(d, "Base Level");
  const topTags = [...d.querySelectorAll("img")]
    .filter(
      (i) =>
        !i.closest("li,.skills,.collapsible-block-content") &&
        /image-tags/.test(i.getAttribute("src") || ""),
    )
    .map((i) => i.getAttribute("src"));
  const rare = topTags.some((s) => /rarelarge|rarelarg\./i.test(s)),
    seasonal = topTags.some((s) => /seasonal|seasonallarge/i.test(s)),
    member = topTags.some((s) => /legendlarge|legendlarge/i.test(s));
  let locations = [];
  if (location) {
    if (location.value)
      locations = [
        {
          text: location.value,
          links: location.links.map((a) => linkData(a, url)),
        },
      ];
    else {
      const next = location.strong.parentElement.nextElementSibling;
      const ul = next?.matches("ul")
        ? next
        : next?.matches(".collapsible-block") &&
            /Locations/i.test(
              text(next.querySelector(".collapsible-block-link")),
            )
          ? next.querySelector(".collapsible-block-content > ul")
          : null;
      if (ul?.matches("ul"))
        locations = [...ul.children]
          .filter((n) => n.nodeName === "LI")
          .map((li) => ({
            text: text(li),
            links: [...li.querySelectorAll("a[href]")].map((a) =>
              linkData(a, url),
            ),
          }));
    }
  }
  let mergeList = null;
  for (const li of d.querySelectorAll("li"))
    if (
      /^Merge the following:/i.test(text(li)) ||
      /^Merge the following\s/i.test(text(li))
    ) {
      mergeList = li.querySelector(":scope > ul");
      if (mergeList) break;
    }
  const merge = mergeList
    ? materialTree(mergeList, url)
    : { tree: null, rows: [], issue: null };
  const priceValue = price?.value || null,
    parsedPrice = parsePrice(priceValue);
  const questLink = price?.links
    .map((a) => linkData(a, url))
    .find((a) => /quests?(?:#|$)|-quests?-/.test(a.url));
  const questName =
    questLink?.name ||
    priceValue?.match(/Reward from (?:the )?['‘’"]([^'‘’"]+)['‘’"]/i)?.[1] ||
    null;
  const dropPriceList = price?.strong.parentElement.nextElementSibling;
  const droppedList = dropPriceList?.matches("ul")
    ? [...dropPriceList.querySelectorAll(":scope > li")].find((li) =>
        /^Dropped by:/i.test(text(li)),
      )
    : null;
  const dropSources = droppedList
    ? [...droppedList.querySelectorAll("a[href]")].map((a) => linkData(a, url))
    : [];
  const dropName = dropSources.length
    ? dropSources.map((s) => s.name).join(" / ")
    : priceValue?.match(/Drop(?:ped)? (?:from|by)\s+(.+?)(?:\)|$)/i)?.[1] ||
      null;
  const prerequisites = [...d.querySelectorAll("li")]
    .filter((li) => !li.closest(".skills,.collapsible-block-content"))
    .map(text)
    .filter(
      (t) =>
        /^Requires?\s|^Must (?:have|be|complete)/i.test(t) &&
        !/Required to (?:accept|access)/i.test(t),
    );
  const level = prerequisites
    .map(
      (t) =>
        t.match(
          /(?:Must be|Requires?)\s+(?:at least\s+)?(?:Level|Lvl)\s*(\d+)/i,
        )?.[1],
    )
    .find(Boolean);
  const methodType = parsedPrice
    ? "shop"
    : mergeList
      ? "merge"
      : questName && /Reward/i.test(priceValue || "")
        ? "quest"
        : dropName
          ? "drop"
          : "other";
  const priceList = price?.strong.parentElement.nextElementSibling;
  const additionalAcquisitions = priceList?.matches("ul")
    ? [...priceList.querySelectorAll(":scope > li")]
        .filter((li) => /^Reward from the:$/i.test(text(li.firstChild)))
        .flatMap((li) =>
          [...li.querySelectorAll(":scope > ul > li")].map((row) => {
            const a = row.querySelector("a[href]");
            return a
              ? {
                  ...linkData(a, url),
                  availability: [...row.querySelectorAll("img")].some((i) =>
                    /raresmall/i.test(i.src),
                  )
                    ? "legacy"
                    : "available",
                }
              : null;
          }),
        )
        .filter(Boolean)
    : [];
  const result = {
    title,
    url,
    sourceHash: sourceHash(html),
    additionalAcquisitions,
    locations,
    priceText: priceValue,
    price: parsedPrice,
    methodType,
    questName,
    questSource: questLink?.url || null,
    dropName,
    dropSources,
    excludedGame: /only works in Infinity/i.test(d.textContent)
      ? "AQWorlds Infinity"
      : null,
    otherAcquisition:
      /This item can only be obtained by redeeming any[^.]*Digital Awesomeness/i.test(
        d.textContent,
      )
        ? {
            label: "IoDA",
            description:
              "Đổi token … of Digital Awesomeness tại Awesome Prizes trong AQW Account Manager. Phiên bản này không cấp badge và không thay thế bản farm trong Quest/Shop yêu cầu bản gốc.",
          }
        : null,
    materials: merge.tree,
    rawMaterials: merge.rows,
    materialIssue: merge.issue,
    prerequisites,
    levelRequirement: level ? Number(level) : null,
    baseLevel: base?.value.match(/^\d+/)
      ? Number(base.value.match(/^\d+/)[0])
      : null,
    membershipRequirement: member ? true : null,
    availability: rare ? "legacy" : seasonal ? "seasonal" : "available",
    availabilityEvidence: topTags.filter((s) =>
      /rare|seasonal|legend/i.test(s),
    ),
    notes: [],
  };
  await w.happyDOM.close();
  return result;
}
export async function parseLinkedAcquisitionPage(html, url, questName) {
  const w = new Window();
  w.document.write(html);
  const d = w.document.querySelector("#page-content");
  if (!d) {
    await w.happyDOM.close();
    throw Error("No linked Wiki content");
  }
  const title = text(w.document.querySelector("#page-title")),
    npcField = field(d, "Shop Owner|NPC|Shop NPC|Quests Begun From"),
    location = field(d, "Locations?|Quest Location");
  const locationLinks = location?.links.map((a) => linkData(a, url)) || [];
  const npcLink = locationLinks.find((a) =>
    /\(NPC\)|-npc(?:#|$)/i.test(a.name + " " + a.url),
  );
  const tags = [...d.querySelectorAll("img")]
    .filter(
      (i) =>
        !i.closest("li,.skills,.collapsible-block-content") &&
        /image-tags/.test(i.getAttribute("src") || ""),
    )
    .map((i) => i.getAttribute("src"));
  const result = {
    title,
    url,
    sourceHash: sourceHash(html),
    isMergeShop: [...w.document.querySelectorAll(".page-tags a")].some((a) =>
      /^merge$/i.test(text(a)),
    ),
    isShop:
      !!field(d, "Shop Owner|Shop NPC") ||
      [...w.document.querySelectorAll(".page-tags a")].some((a) =>
        /^(shop|merge)$/i.test(text(a)),
      ),
    npc:
      npcField?.value ||
      npcLink?.name ||
      title?.match(/^(.*?)'s Quests$/)?.[1] ||
      null,
    map:
      locationLinks
        .filter((l) => l !== npcLink)
        .map((l) => l.name)
        .join(" / ") ||
      location?.value ||
      null,
    availability: tags.some((s) => /rarelarge|rarelarg\./i.test(s))
      ? "legacy"
      : tags.some((s) => /seasonal/i.test(s))
        ? "seasonal"
        : "unknown",
    prerequisites: [
      ...d.querySelectorAll("li"),
      ...[...d.querySelectorAll("p")].filter((p) => /^Notes?:/i.test(text(p))),
    ]
      .filter((li) => !li.closest(".skills,.collapsible-block-content"))
      .map((n) => text(n).replace(/^Notes?:\s*/i, ""))
      .concat(field(d, "Notes?")?.value || "")
      .filter(
        (t) =>
          /^Requires?\s|^Must (?:have|be|complete)/i.test(t) &&
          !/Required to (?:accept|access)/i.test(t),
      ),
    materials: null,
    questMatched: false,
    questSteps: [],
    issues: [],
  };
  if (questName) {
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const panels = [];
    for (const nav of d.querySelectorAll(".yui-navset")) {
      const names = [...nav.querySelectorAll(":scope > .yui-nav > li")].map(
          text,
        ),
        contents = [
          ...(nav.querySelector(":scope > .yui-content")?.children || []),
        ];
      if (names.length !== contents.length) continue;
      names.forEach((name, index) => {
        if (normalize(name) === normalize(questName))
          panels.push({
            nav,
            names,
            contents,
            index,
            content: contents[index],
          });
      });
    }
    const hash = new URL(url).hash.slice(1);
    let candidates = panels;
    if (candidates.length > 1 && hash)
      candidates = panels.filter((p) => {
        let previous = p.nav.previousElementSibling;
        while (previous) {
          if (previous.querySelector("a[name]"))
            return !!previous.querySelector(`a[name="${hash}"]`);
          previous = previous.previousElementSibling;
        }
        return false;
      });
    const panel = candidates.length === 1 ? candidates[0] : null;
    const block =
      panel?.content ||
      [...d.querySelectorAll(".collapsible-block")]
        .find(
          (el) =>
            normalize(
              text(
                el.querySelector(
                  ".collapsible-block-folded .collapsible-block-link",
                ),
              ).replace(/^\+\s*/, ""),
            ) === normalize(questName),
        )
        ?.querySelector(".collapsible-block-content");
    if (block) {
      if (panel) {
        const context = w.document.createElement("div");
        let prev = panel.nav.previousElementSibling;
        while (prev) {
          if (
            prev.nodeName === "P" &&
            /Quest Location:|Quests Begun From:/i.test(text(prev))
          ) {
            context.append(prev.cloneNode(true));
            break;
          }
          if (prev.nodeName === "HR" || prev.querySelector("a[name]")) break;
          prev = prev.previousElementSibling;
        }
        const place = field(context, "Quest Location|Locations?"),
          owner = field(context, "Quests Begun From|NPC");
        if (place)
          result.map =
            place.value || place.links.map((a) => text(a)).join(" / ");
        if (owner) result.npc = owner.value;
        const note = field(context, "Notes?");
        if (note?.value) result.questNotes = [note.value];
      }
      result.questMatched = true;
      const parseQuest = (content, name, index) => {
        const requirements = [...content.querySelectorAll(":scope > p")].find(
          (p) => /^Requirements?:/i.test(text(p)),
        );
        const requirementText = requirements
          ? text(requirements).replace(/^Requirements?:\s*/i, "")
          : "";
        const prerequisites = requirementText
          ? [requirementText]
          : requirements?.nextElementSibling?.matches("ul")
            ? [
                ...requirements.nextElementSibling.querySelectorAll(
                  ":scope > li",
                ),
              ]
                .map(text)
                .filter(Boolean)
            : [];
        const heading = [...content.querySelectorAll("p,h3,h4")].find((el) =>
          /^Items Required:$/i.test(text(el)),
        );
        const ul = heading?.nextElementSibling;
        const parsed = ul?.matches("ul") ? materialTree(ul, url) : null;
        const rewardHeading = [...content.querySelectorAll(":scope > p")].find(
          (p) => /^Items:$/i.test(text(p)),
        );
        const rewards = rewardHeading?.nextElementSibling?.matches("ul")
          ? [
              ...rewardHeading.nextElementSibling.querySelectorAll(
                ":scope > li",
              ),
            ].map(text)
          : [];
        return {
          name,
          index,
          prerequisites,
          materials: parsed?.tree || null,
          rawMaterials: parsed?.rows || [],
          issues: parsed?.issue ? [parsed.issue] : [],
          reward: rewards.join(" / ") || "Xem reward của quest tại nguồn",
          source: url,
        };
      };
      const target = parseQuest(block, questName, panel?.index || 0);
      result.prerequisites = target.prerequisites;
      result.materials = target.materials;
      result.issues.push(...target.issues);
      const chain = [];
      if (panel) {
        let index = panel.index;
        for (let guard = 0; guard < panel.names.length; guard++) {
          const step = parseQuest(
            panel.contents[index],
            panel.names[index],
            index,
          );
          chain.unshift(step);
          if (
            step.prerequisites.some((p) =>
              /completed the previous quest/i.test(p),
            ) &&
            index > 0
          ) {
            index--;
            continue;
          }
          const previous = step.prerequisites
            .flatMap((t) =>
              [...t.matchAll(/['‘]([^'’]+)['’]/g)].map((m) => m[1]),
            )
            .map((name) =>
              panel.names.findIndex((n) => normalize(n) === normalize(name)),
            )
            .filter((i) => i >= 0 && i < index);
          if (previous.length === 1) {
            index = previous[0];
            continue;
          }
          break;
        }
      } else chain.push(target);
      result.questSteps = chain;
    } else
      result.issues.push(
        "Exact quest disclosure not resolved; do not borrow another quest prerequisites/materials",
      );
  }
  await w.happyDOM.close();
  return result;
}

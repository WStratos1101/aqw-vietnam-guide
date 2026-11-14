import { Window } from "happy-dom";
import { item, validateMaterials } from "../../src/lib/material-requirements.mjs";

export function wikiText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll("script,style,.wd-adunit").forEach(el => el.remove());
  clone.querySelectorAll("br").forEach(el => el.replaceWith("\n"));
  clone.querySelectorAll("p,li,div,h1,h2,h3,h4,tr").forEach(el => el.append("\n"));
  return clone.textContent.split(/\r?\n/).map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

function field(text, label) {
  return text.match(new RegExp("^" + label + ":[ \\t]*([^\\n]+)", "im"))?.[1]?.trim() || null;
}

function labelNode(root, label) {
  return [...root.querySelectorAll("strong")].find(el => el.textContent.trim() === label + ":");
}

function listAfter(node) {
  if (!node) return null;
  let sibling = node.parentElement.tagName === "P" ? node.parentElement.nextElementSibling : node.nextElementSibling;
  while (sibling?.tagName === "BR") sibling = sibling.nextElementSibling;
  return sibling?.tagName === "UL" ? sibling : null;
}

function rows(list, url) {
  if (!list) return [];
  return [...list.children].filter(el => el.tagName === "LI").flatMap(li => {
    const clone = li.cloneNode(true);
    clone.querySelectorAll("ul,ol").forEach(el => el.remove());
    const value = clone.textContent.replace(/\s+/g, " ").trim();
    if (!value || value === "N/A") return [];
    const match = value.match(/^(.*?)\s+[x×]([\d,]+)(?:\s*\(.*\))?$/);
    const name = match?.[1] || value;
    const link = clone.querySelector("a[href]");
    const monster = [...li.querySelectorAll("ul li")].find(el => /Dropped by/i.test(el.textContent));
    return [{ name, quantity: match ? Number(match[2].replaceAll(",", "")) : 1,
      ...(link ? { wikiUrl: new URL(link.getAttribute("href"), url).href } : {}),
      ...(monster ? { monster: monster.textContent.replace(/Dropped by:?\s*/i, "").trim() } : {}) }];
  });
}

function requirements(root) {
  const node = labelNode(root, "Requirements");
  if (!node) return [];
  const list = listAfter(node);
  if (list) return [...list.children].map(el => el.textContent.replace(/\s+/g, " ").trim());
  return [field(wikiText(node.parentElement), "Requirements")].filter(Boolean);
}

export function parseFarmReviewPage(html, url) {
  const window = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
  try {
    window.document.write(html);
    const doc = window.document, body = doc.querySelector("#page-content");
    if (!body) throw Error("Missing Wiki main body");
    const text = wikiText(body);
    const quests = [];
    for (const view of body.querySelectorAll(".yui-navset")) {
      const labels = [...view.querySelectorAll(":scope > .yui-nav > li")].map(el => el.textContent.trim());
      const panels = [...view.querySelectorAll(":scope > .yui-content > div")];
      const context = [];
      for (let el = view.previousElementSibling; el && el.tagName !== "HR"; el = el.previousElementSibling)
        if (el.tagName === "P") context.unshift(el);
      const contextText = context.map(wikiText).join("\n");
      for (const [index, panel] of panels.entries()) {
        const required = labelNode(panel, "Items Required");
        if (!required || !labels[index]) continue; // Item artwork tabs are not quests.
        const panelText = wikiText(panel);
        const rewardList = listAfter(labelNode(panel, "Items") || labelNode(panel, "You may also choose one of"));
        quests.push({ name: labels[index], location: field(contextText, "Quest Locations?"), npc: field(contextText, "Quests Begun From"),
          locationLinks: context.flatMap(el => [...el.querySelectorAll("a[href]")].map(a => ({ name: a.textContent.trim(), url: new URL(a.getAttribute("href"), url).href }))),
          requirements: [...context.flatMap(requirements), ...requirements(panel)],
          repeatability: /once.*per week/i.test(contextText + "\n" + panelText) ? "weekly" : /once.*per day/i.test(contextText + "\n" + panelText) ? "daily" : null,
          required: rows(listAfter(required), url), rewards: rows(rewardList, url), text: panelText });
      }
    }
    const locationBlock = text.match(/^Locations?:[ \t]*([^]*?)(?=^Price:)/im)?.[1]?.trim() || null;
    const locationNode = labelNode(body, "Location") || labelNode(body, "Locations");
    const locationLinks = [];
    if (locationNode?.parentElement.tagName === "P") {
      const container = locationNode.parentElement;
      let started = false;
      for (const node of container.childNodes) {
        if (node === locationNode) { started = true; continue; }
        if (!started) continue;
        if (node.nodeType === 1 && node.tagName === "STRONG" && /^(Price|Sellback):/.test(node.textContent)) break;
        if (node.nodeType === 1) for (const a of [ ...(node.tagName === "A" ? [node] : []), ...node.querySelectorAll("a[href]") ])
          locationLinks.push({ name:a.textContent.trim(), url:new URL(a.getAttribute("href"),url).href });
      }
      const list = listAfter(locationNode);
      if (list) for (const a of list.querySelectorAll("a[href]")) locationLinks.push({ name:a.textContent.trim(), url:new URL(a.getAttribute("href"),url).href });
    }
    const mergeLabels = [...body.querySelectorAll("strong")].filter(el => /^Merge the following:?$/.test(el.textContent.trim()));
    const mergeLists = [...new Set([
      ...mergeLabels.map(listAfter),
      ...[...body.querySelectorAll("li > ul")].filter(list => {
        const label = list.parentElement.cloneNode(true);
        label.querySelectorAll("ul,ol").forEach(el => el.remove());
        return /^Merge the following:?$/.test(label.textContent.trim());
      }),
    ])];
    const mergeRecipes = mergeLists.map(list => {
      if (!list || list.querySelector("ul,ol")) return { status: "PENDING_STRUCTURE", tree: null };
      const values = rows(list, url);
      if (!values.length || values.some(row => /\b(?:OR|AND)\b/.test(row.name))) return { status: "PENDING_STRUCTURE", tree: null };
      const tree = { kind: "allOf", requirements: values.map(row => {
        const currency = row.name.match(/^([\d,]+) (Gold|ACs?)$/);
        return currency ? item(currency[2], Number(currency[1].replaceAll(",", "")), url) : item(row.name, row.quantity, url);
      }) };
      return { status: validateMaterials(tree).length ? "PENDING_STRUCTURE" : "explicit-list", tree: validateMaterials(tree).length ? null : tree };
    });
    const alternativeBlock = text.match(/^Reward from the following quests?:\n([^]*?)(?=^Sellback:)/im)?.[1] || "";
    const questAlternatives = alternativeBlock.split("\n").flatMap(line => {
      const match = line.match(/^'(.+)'(?:\s+\((.+)\))?$/);
      if (!match) return [];
      return [{ quest: match[1], npc: match[2] || null, sources: [...new Set([...body.querySelectorAll("a[href]")].filter(a => a.textContent.trim() === match[1]).map(a => new URL(a.getAttribute("href"), url).href))] }];
    });
    return { text, quests, location: locationBlock?.replace(/\n/g, " · ") || null,
      mergeRecipes, questAlternatives, locationLinks,
      joinCommands: [...new Set([...text.matchAll(/\/join\s+([a-z0-9_-]+)/gi)].map(m => "/join " + m[1]))] };
  } finally { window.happyDOM.close(); }
}

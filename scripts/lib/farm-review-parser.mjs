import { Window } from "happy-dom";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { item, validateMaterials } from "../../src/lib/material-requirements.mjs";

// Detached documents avoid retaining a Window (and its asynchronous teardown)
// for every cached Wiki page in a synchronous catalog build.
const parserWindow = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
const parser = new parserWindow.DOMParser();

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
  return [...root.querySelectorAll("strong")].find(el => el.textContent.trim().replace(/:$/,'').toLowerCase() === label.toLowerCase());
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
      ...(monster ? { monster: monster.textContent.replace(/Dropped by:?\s*/i, "").trim(),
        ...(monster.querySelector('a[href]') ? {monsterWikiUrl:new URL(monster.querySelector('a[href]').getAttribute('href'),url).href} : {}) } : {}),
      ...( /\((?:Temporary|Temp(?:orary)? Item)\)/i.test(value) ? {temporary:true} : {}) }];
  });
}

function requirements(root) {
  const node = labelNode(root, "Requirements") || labelNode(root,"Requirement");
  if (!node) return [];
  // Inline requirements can be followed by a Notes list. That list belongs
  // to Notes, and must not replace the actual prerequisite in the paragraph.
  const inline = field(wikiText(node.parentElement), "Requirements?");
  if (inline) return [inline];
  const list = listAfter(node);
  if (list) return [...list.children].map(el => el.textContent.replace(/\s+/g, " ").trim());
  return [];
}

function questContext(view) {
  const context=[];
  for(let el=view.previousElementSibling;el&&el.tagName!=='HR'&&!el.matches('.yui-navset');el=el.previousElementSibling)
    if(['P','UL'].includes(el.tagName))context.unshift(el);
  const parent=view.parentElement?.closest('.yui-navset');
  return parent?[...questContext(parent),...context]:context;
}

export function parseFarmReviewPage(html, url) {
  {
    const doc = parser.parseFromString(html, "text/html"), body = doc.querySelector("#page-content");
    if (!body) throw Error("Missing Wiki main body");
    const text = wikiText(body);
    const quests = [];
    const views = [...body.querySelectorAll(".yui-navset")];
    for (const [viewIndex, view] of views.entries()) {
      const labels = [...view.querySelectorAll(":scope > .yui-nav > li")].map(el => el.textContent.trim());
      const panels = [...view.querySelectorAll(":scope > .yui-content > div")];
      const context = questContext(view);
      const contextText = context.map(wikiText).join("\n");
      const locationLabel=context.flatMap(root=>[...root.querySelectorAll("strong")]).find(node=>/^Quest Locations?:$/.test(node.textContent.trim()));
      const locationNames=listAfter(locationLabel)?[...listAfter(locationLabel).querySelectorAll("a[href]")].map(a=>a.textContent.trim()):[];
      for (const [index, panel] of panels.entries()) {
        if (panel.matches('.yui-navset')) continue;
        // A parent location tab can contain another quest navset. Its labels,
        // requirements and rewards must never inherit those of a child quest.
        const isolated = panel.cloneNode(true);
        isolated.querySelectorAll(".yui-navset").forEach(node => node.remove());
        const required = labelNode(isolated, "Items Required");
        if (!required || !labels[index]) continue; // Item artwork tabs are not quests.
        const panelText = wikiText(isolated);
        const rewardList = listAfter(labelNode(isolated, "Items") || labelNode(isolated, "You may also choose one of"));
        quests.push({ name: labels[index], sectionIdentity: `nav-${viewIndex}/panel-${index}`, sourceUrl: url,
          locationNames, location: field(contextText, "Quest Locations?"), npc: field(contextText, "Quests Begun From"),
          previousQuest: labels[index - 1] || null,
          ownedItems: [...context, isolated].flatMap(root => [root,...root.querySelectorAll("li,p")]
            .filter(node => ["P","LI"].includes(node.tagName) && /(?:in your inventory|in inventory)/i.test(node.textContent))
            .flatMap(node => [...node.querySelectorAll("a[href]")].filter(a=>node.textContent.indexOf(a.textContent)>=Math.max(0,node.textContent.search(/Must (?:have|own)/i))).map(a => ({ name: a.textContent.trim(), wikiUrl: new URL(a.getAttribute("href"), url).href })))),
          locationLinks: context.flatMap(el => [...el.querySelectorAll("a[href]")].map(a => ({ name: a.textContent.trim(), url: new URL(a.getAttribute("href"), url).href }))),
          requirements: [...context.flatMap(requirements), ...requirements(isolated)],
          repeatability: /once.*per week/i.test(contextText + "\n" + panelText) ? "weekly" : /once.*per day/i.test(contextText + "\n" + panelText) ? "daily" : null,
          required: rows(listAfter(required), url), rewards: rows(rewardList, url),
          fixedRewards: rows(listAfter(labelNode(isolated, "Items")), url),
          choiceRewards: rows(listAfter(labelNode(isolated, "You may also choose one of")), url),
          randomRewards: rows(listAfter(labelNode(isolated, "You may also receive, at random")), url),
          randomChoiceRewards: rows(listAfter(labelNode(isolated, "You will receive one of the following items")), url),
          text: panelText });
      }
    }
    const locationBlock = text.match(/^Locations?:[ \t]*([^]*?)(?=^Price:)/im)?.[1]?.trim() || null;
    // Field links are bounded by the next label, even when all fields share
    // one paragraph. A following Notes/Also-see list is never a location.
    const boundedLinks = (label) => {
      const start = labelNode(body, label);
      const links = [];
      let active = false;
      for (const node of body.querySelectorAll("strong,a[href]")) {
        if (node === start) { active = true; continue; }
        if (!active) continue;
        if (node.tagName === "STRONG" && /^(?:Price|Locations?|Notes?|Level|HP|Total HP|Attacks|Type|Description|Sellback|Rarity|Base Damage|Merge the following)(?::|$)/i.test(node.textContent.trim())) break;
        if (node.tagName === "A") links.push({ name: node.textContent.trim(), url: new URL(node.getAttribute("href"), url).href });
      }
      return links;
    };
    const acquisitionLinks = boundedLinks("Price");
    const locationLinks = labelNode(body, "Location") ? boundedLinks("Location") : boundedLinks("Locations");
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
        return currency ? item(currency[2], Number(currency[1].replaceAll(",", "")), url) : {...item(row.name, row.quantity, url), ...(row.wikiUrl ? {wikiUrl:row.wikiUrl} : {})};
      }) };
      return { status: validateMaterials(tree).length ? "PENDING_STRUCTURE" : "explicit-list", tree: validateMaterials(tree).length ? null : tree };
    });
    const dropLists=[listAfter(labelNode(body,"Dropped by")),...[...body.querySelectorAll("li > ul")].filter(list=>{
      const label=list.parentElement.cloneNode(true);label.querySelectorAll("ul,ol").forEach(el=>el.remove());
      return /^Dropped by:$/i.test(label.textContent.trim());
    })];
    const droppedBy=dropLists.flatMap(list=>rows(list,url));
    const temporaryDrops=rows(listAfter(labelNode(body,'Temporary Items Dropped')),url).map(row=>({...row,
      name:row.name.replace(/\s*\(Dropped during[^]*$/i,''),
      requiredQuest:row.name.match(/Dropped during the '(.+)' quest/i)?.[1]||null}));
    const alternativeBlock = text.match(/^Reward from the following quests?:\n([^]*?)(?=^Sellback:)/im)?.[1] || "";
    const questAlternatives = alternativeBlock.split("\n").flatMap(line => {
      const match = line.match(/^'(.+)'(?:\s+\((.+)\))?$/);
      if (!match) return [];
      return [{ quest: match[1], npc: match[2] || null, sources: [...new Set([...body.querySelectorAll("a[href]")].filter(a => a.textContent.trim() === match[1]).map(a => new URL(a.getAttribute("href"), url).href))] }];
    });
    const shopInventory=[...body.querySelectorAll("table")].filter(table=>[...table.querySelectorAll("th")].some(cell=>cell.textContent.trim()==="Name")).flatMap(table=>[...table.querySelectorAll("tr")].flatMap(tr=>{
      const cells=[...tr.querySelectorAll(":scope > td")];
      const link=cells.slice(0,-1).flatMap(cell=>[...cell.querySelectorAll("a[href]")]).find(a=>!a.querySelector("img")&&a.textContent.trim());
      return link?[{name:link.textContent.trim(),url:new URL(link.getAttribute("href"),url).href}]:[];
    }));
    const shopRows=[...body.querySelectorAll("table")].filter(table=>{
      const headers=[...table.querySelectorAll("th")].map(cell=>cell.textContent.trim());
      return headers.includes("Name") && headers.includes("Price");
    }).flatMap(table=>[...table.querySelectorAll("tr")].flatMap(tr=>{
      const cells=[...tr.querySelectorAll(":scope > td")], price=cells.at(-1)?.textContent.trim().match(/^([\d,]+) (Gold|ACs?)$/);
      if(!price)return [];
      const link=cells.slice(0,-1).flatMap(cell=>[...cell.querySelectorAll("a[href]")]).find(a=>!a.querySelector("img")&&a.textContent.trim());
      if(!link)return [];
      return [{name:link.textContent.trim(),url:new URL(link.getAttribute("href"),url).href,
        purchase:{amount:Number(price[1].replaceAll(",","")),currency:/^gold$/i.test(price[2])?"Gold":"ACs"},
        requirements:cells.slice(0,-1).map(cell=>cell.textContent.trim()).filter(value=>value&&value!==link.textContent.trim()&&value!=="N/A")}];
    }));
    return { text, quests, droppedBy, temporaryDrops, shopRows, shopInventory, acquisitionLinks,
      images:[...body.querySelectorAll('img[src]')].map(img=>({url:new URL(img.getAttribute('src'),url).href})),
      price: field(text,"Price"), location: locationBlock?.replace(/\n/g, " · ") || null,
      itemLinks: [...body.querySelectorAll("a[href]")].filter(a => /^(?:\/|https?:\/\/aqwwiki\.wikidot\.com\/)/.test(a.getAttribute("href")))
        .map(a => ({ name: a.textContent.trim(), url: new URL(a.getAttribute("href"), url).href })),
      mergeRecipes, questAlternatives, locationLinks: [...new Map(locationLinks.map(link => [link.url + "|" + link.name, link])).values()],
      joinCommands: [...new Set([...text.matchAll(/\/join\s+([a-z0-9_-]+)/gi)].map(m => "/join " + m[1]))] };
  }
}

// Parsing runs in bounded batches: happy-dom retains document internals until
// its realm is collected. No DOM objects cross this process boundary.
export function loadVerifiedFarmPages(sources) {
  const result=[];
  for(let start=0;start<sources.length;start+=12){
    const batch=sources.slice(start,start+12);
    for(const source of batch) if(createHash("sha256").update(fs.readFileSync(source.sourceFile)).digest("hex")!==source.sourceHash)
      throw Error("Changed Farm Wiki snapshot: "+source.url);
    const parsed=JSON.parse(execFileSync(process.execPath,["--input-type=module","-e",`
      import fs from 'node:fs';
      import { parseFarmReviewPage } from './scripts/lib/farm-review-parser.mjs';
      const batch=JSON.parse(fs.readFileSync(0,'utf8'));
      process.stdout.write(JSON.stringify(batch.map(source=>({...source,...parseFarmReviewPage(fs.readFileSync(source.sourceFile,'utf8'),source.url)}))));
    `],{input:JSON.stringify(batch),encoding:"utf8",maxBuffer:32*1024*1024}));
    result.push(...parsed);
  }
  return result;
}

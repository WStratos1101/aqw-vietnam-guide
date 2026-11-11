import fs from "node:fs";
import { Window } from "happy-dom";
const file = "src/content/classes/skill-registry.json",
  r = JSON.parse(fs.readFileSync(file));
const pages = new Map();
for (const url of new Set(
  r.skills
    .filter((s) => s.verificationStatus === "verified")
    .map((s) => s.sourceUrl),
)) {
  const w = new Window();
  w.document.write(
    fs.readFileSync(
      "content-sources/class-wiki/" + new URL(url).pathname.slice(1) + ".html",
      "utf8",
    ),
  );
  const list = [];
  for (const el of w.document.querySelectorAll(
    "#page-content .collapsible-block-content",
  )) {
    if (
      el.querySelector(".collapsible-block-content") ||
      !el.textContent.includes("Rank Needed:")
    )
      continue;
    const name =
      el.querySelector("p strong span")?.textContent.trim() ||
      el.querySelector("p strong")?.textContent.trim();
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
    list.push({ name, fields });
  }
  pages.set(url, list);
  await w.happyDOM.close();
}
let conditional = 0;
for (const s of r.skills.filter((s) => s.verificationStatus === "verified")) {
  const e = pages.get(s.sourceUrl)?.find((e) => e.name === s.officialName);
  if (!e)
    throw Error(
      "Verified skill field source not found " + s.classId + "/" + s.skillId,
    );
  for (const [key, label] of [
    ["manaCost", "Mana Cost"],
    ["cooldown", "Cooldown"],
  ]) {
    const value = e.fields[label];
    if (value) {
      s[key + "Display"] = value;
      if (/^\d+(?:\.\d+)?\s*(?:Mana|MP|Seconds?|sec|s)$/i.test(value))
        s[key] = Number(value.match(/^\d+(?:\.\d+)?/)[0]);
      else {
        s[key] = null;
        conditional++;
      }
    }
  }
}
fs.writeFileSync(file, JSON.stringify(r, null, 2) + "\n");
console.log({ preservedConditionalStatFields: conditional });

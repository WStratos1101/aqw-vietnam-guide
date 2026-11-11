import{Window}from'happy-dom';import{wiki,sha as hash}from'./wiki-v12-6.mjs';
const dir='content-sources/v12-6/wiki';
export async function parseClassPage(url) {
  const slug = new URL(url).pathname.slice(1),
    file = dir + "/" + slug + ".html";
  const page=await wiki(url);
  const bytes=Buffer.from(page.html);await page.w.happyDOM.close();
  const
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
    const retired = [...el.querySelectorAll('s, del, strike, [style*="line-through"]')];
    retired.forEach(node => node.remove());
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
      fields[key] = value.replace(/\s+/g, " ").trim();
    }
    entries.push({
      officialName: name,
      hasRetiredValues: retired.length > 0,
      manaCostDisplay: fields["Mana Cost"] || null,
      cooldownDisplay: fields.Cooldown || null,
      rank: Number(fields["Rank Needed"]?.match(/\d+/)?.[0] ?? NaN),
      passive: /passive|rank 10/i.test(fields.Type || ""),
      manaCost: fields["Mana Cost"]?.match(/^\d+(?:\.\d+)?/)?.[0],
      cooldown: fields.Cooldown?.match(/^\d+(?:\.\d+)?/)?.[0],
      skillType: fields.Type || null,
      target: fields.Range || null,
      officialDescription: fields.Description || null,
      notes: [...el.querySelectorAll("li")].map((e) => e.textContent.replace(/\s+/g, " ").trim()),
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
    excludedGame:/only works in Infinity/i.test(d.textContent)?"AQWorlds Infinity":null,
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

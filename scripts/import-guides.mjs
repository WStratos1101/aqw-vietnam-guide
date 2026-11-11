import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const input = "content-sources";
const sources = fs
  .readdirSync(input)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(input, f), "utf8")));
const text = (n) =>
  n.type === "table"
    ? n.rows
        .flatMap((r) => r.cells.flatMap((c) => c.blocks.map(text)))
        .join("\n")
    : n.runs.map((r) => r.text || "").join("");
const slug = (t) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const clean = (t) =>
  t
    .trim()
    .replace(/^(?:[IVX]+|\d+)\.\s*/, "")
    .replace(/\s+(?:Class Obtain Guide|Farming Guides|Guide)$/i, "")
    .trim();
const titleOverrides = {
  "General Items": "Boosted items cơ bản",
  "UPGRADE BONUS PACKAGE": "Gói Upgrade Bonus",
  "Game Commands": "Lệnh game đầy đủ",
  "Leveling-up": "Hướng dẫn lên cấp",
  "Farming Gold": "Farm Gold",
  Reputation: "Farm Reputation",
  "How to Play the Alchemy Minigame": "Alchemy",
  "How to Play the SpellCrafting Minigame": "SpellCrafting",
  "List all Boosted Items": "Danh sách boosted items",
  "Starter Boosted Items": "Boosted items khởi đầu",
  "Best Boosted Set": "Bộ boosted items đề xuất",
  General: "Hướng dẫn chung",
  "Acronyms (thuật ngữ hay dùng)": "Thuật ngữ AQW đầy đủ",
  "Combat Stats": "Thuật ngữ chiến đấu",
  Classes: "Viết tắt Class",
  Items: "Viết tắt Item",
  Misc: "Thuật ngữ khác",
};
const categoryFor = (source, group, title) => {
  if (source.key === "bonus-guide") return "he-thong";
  if (source.key === "class-guide") return "class";
  if (source.key === "farming-guide") return "farm";
  if (source.key === "challenge-guide") return "huong-dan";
  if (/Story|Chương|Misadventures/.test(group)) return "cot-truyen";
  if (/Boosted/.test(group)) return "trang-bi";
  if (/Acronyms|Advanced/.test(group)) return "he-thong";
  if (/Leveling|Gold|Reputation/.test(title)) return "farm";
  if (/Alchemy|SpellCraft/.test(title)) return "he-thong";
  return "huong-dan";
};
const pages = [];
const groups = [];
const removed = [];
const ids = new Set([
  "he-thong/membership",
  "class/warrior",
  "class/mage",
  "class/healer",
  "farm/blade-of-awe",
  "trang-bi/blade-of-awe",
  "huong-dan/bat-dau",
  "he-thong/enhancement",
  "cot-truyen/hanh-trinh-chaos",
  "he-thong/hanh-trang",
  "he-thong/stats",
  "he-thong/combat",
  "he-thong/reputation",
  "he-thong/quest-mechanics",
  "he-thong/gold-adventurecoins",
  "huong-dan/cam-nang-aqw-vietnam",
  "huong-dan/lenh-game",
  "he-thong/thuat-ngu-aqw",
  "he-thong/hieu-ve-boost",
]);
for (const source of sources) {
  // Plain export still retains every textual cell. Recover the explicit Class boundaries from the author's How to get labels.
  if (source.source.key === "class-guide") {
    for (let i = 1; i < source.nodes.length; i++) {
      if (/^How to get\s*:/i.test(text(source.nodes[i]).trim())) {
        let j = i - 1;
        while (j >= 0 && !text(source.nodes[j]).trim()) j--;
        if (
          j >= 0 &&
          text(source.nodes[j]).trim().length < 180 &&
          !/^HEADING_[12]$/.test(source.nodes[j].style)
        )
          source.nodes[j].classBoundary = true;
      }
    }
  }
  let group = null,
    page = null;
  for (let i = 0; i < source.nodes.length; i++) {
    const node = source.nodes[i],
      raw = text(node).trim();
    const level =
      node.style === "HEADING_1"
        ? 1
        : node.style === "HEADING_2"
          ? 2
          : node.classBoundary
            ? 3
            : 0;
    if (level && raw) {
      const sourceTitle = raw;
      const basic = clean(raw);
      const title = titleOverrides[basic] || basic;
      const category = categoryFor(
        source.source,
        level === 1 ? raw : group?.sourceTitle || "",
        raw,
      );
      let pageSlug =
        source.source.key === "game-guide" && /General Items Guide/.test(raw)
          ? "general-boosted"
          : slug(basic) || "guide";
      let key = category + "/" + pageSlug;
      if (ids.has(key)) {
        pageSlug = source.source.key + "-" + pageSlug;
        key = category + "/" + pageSlug;
      }
      if (ids.has(key)) {
        pageSlug += "-" + node.sourceIndex;
        key = category + "/" + pageSlug;
      }
      ids.add(key);
      const created = {
        id: source.source.key + "-" + category + "-" + pageSlug,
        category,
        slug: pageSlug,
        title,
        sourceTitle,
        sourceHeadingId: node.id,
        sourceIndex: node.sourceIndex,
        documentId: source.source.id,
        documentTitle: source.source.title,
        groupId: level === 1 ? null : group?.id || null,
        parentId: level === 3 ? page?.id || null : null,
        level,
        rawNodes: [],
        source: source.source,
        sectionHeadingIds: [],
      };
      if (level === 1) {
        group = created;
        groups.push(created);
      }
      if (level !== 3) page = created;
      else page = created;
      pages.push(created);
      continue;
    }
    if (page) page.rawNodes.push(node);
  }
  for (const excluded of source.excluded || [])
    removed.push({ documentId: source.source.id, ...excluded });
}
// Repair a Class child page's parent: consecutive Class boundaries share their H2 parent.
for (let i = 0; i < pages.length; i++)
  if (pages[i].level === 3) {
    let j = i - 1;
    while (j >= 0 && pages[j].level === 3) j--;
    pages[i].parentId = pages[j]?.id || pages[i].groupId;
  }
const byId = new Map(pages.map((p) => [p.id, p]));
const headingMap = new Map();
const docRoots = new Map();
function visit(nodes, fn) {
  for (const n of nodes) {
    fn(n);
    if (n.type === "table")
      for (const r of n.rows) for (const c of r.cells) visit(c.blocks, fn);
  }
}
for (const p of pages) {
  const href = "/" + p.category + "/" + p.slug;
  if (!docRoots.has(p.documentId)) docRoots.set(p.documentId, p);
  headingMap.set(p.documentId + ":" + p.sourceHeadingId, href);
  visit(p.rawNodes, (n) => {
    if (n.id?.startsWith("h."))
      headingMap.set(p.documentId + ":" + n.id, href + "#" + n.id);
  });
}
const unresolved = [];
let internalLinks = 0;
function linkFor(link, label, current) {
  if (!link) return undefined;
  if (link.headingId) {
    const href = headingMap.get(current.documentId + ":" + link.headingId);
    if (href) {
      internalLinks++;
      return href;
    }
    return undefined;
  }
  if (!link.url) return undefined;
  let u;
  try {
    u = new URL(link.url);
  } catch {
    return undefined;
  }
  if (!["http:", "https:"].includes(u.protocol)) return undefined;
  if (
    u.hostname === "docs.google.com" &&
    u.pathname.startsWith("/document/d/")
  ) {
    const id = u.pathname.split("/")[3];
    const heading = new URLSearchParams(u.hash.slice(1)).get("heading");
    let href = headingMap.get(id + ":" + heading);
    if (!href) {
      const normalized = slug(label).replace(/-(?:guide|class|obtain)$/g, "");
      const candidates = pages.filter(
        (p) =>
          p.documentId === id &&
          normalized.length > 4 &&
          (slug(p.sourceTitle).includes(normalized) ||
            normalized.includes(slug(p.title))),
      );
      const target =
        candidates.sort(
          (a, b) => a.sourceTitle.length - b.sourceTitle.length,
        )[0] || docRoots.get(id);
      if (target) href = "/" + target.category + "/" + target.slug;
    }
    if (href) {
      internalLinks++;
      return href;
    }
    unresolved.push({ documentId: id, label, from: current.id });
    return undefined;
  }
  return link.url;
}
const excludedRanges = new Map();
for (const source of sources) {
  visit(source.nodes, (n) => {
    if (
      n.type === "paragraph" &&
      (/Note: Với bot Grimlite/i.test(text(n)) ||
        /Loader\/Grabber.*bot/i.test(text(n)))
    )
      excludedRanges.set(
        source.source.id + ":" + n.sourceIndex,
        "Bot automation instructions excluded by project scope",
      );
  });
  if (source.source.method === "text-export") {
    for (const n of source.nodes) {
      const t = text(n).trim();
      if (/^(Step\s+\d|Bước\s+\d)/i.test(t) && t.length < 140)
        n.style = "HEADING_3";
    }
  }
}
// Do not publish bot setup/quest-loader recipes, or the PvP Infinite Healing exploit setup.
for (const source of sources) {
  if (source.source.key === "class-guide") {
    const nodes = source.nodes;
    for (let i = 0; i < nodes.length; i++) {
      if (/Setup:.*Self-DoT.*HoT/.test(text(nodes[i]))) {
        let end = i;
        while (
          end + 1 < nodes.length &&
          !/^Combo:/.test(text(nodes[end + 1]).trim())
        )
          end++;
        for (let k = i; k <= end; k++)
          excludedRanges.set(
            source.source.id + ":" + nodes[k].sourceIndex,
            "PvP exploit setup excluded",
          );
      }
    }
  }
}
let paragraphCount = 0,
  tableCount = 0;
const renderedIds = [];
const omittedImages = new Map();
function convert(nodes, current) {
  const out = [];
  for (const n of nodes) {
    if (excludedRanges.has(current.documentId + ":" + n.sourceIndex)) {
      removed.push({
        documentId: current.documentId,
        index: n.sourceIndex,
        reason: excludedRanges.get(current.documentId + ":" + n.sourceIndex),
      });
      continue;
    }
    if (n.type === "table") {
      tableCount++;
      const active = [];
      const rows = n.rows.map((r, ri) => {
        const cells = [];
        let col = 0;
        const grid = r.cells.length === n.columns;
        for (let ci = 0; ci < r.cells.length; ci++) {
          if (grid) col = ci;
          else while (active[col] > ri) col++;
          const c = r.cells[ci];
          if (active[col] > ri) continue;
          let colSpan = Math.min(c.colSpan || 1, Math.max(1, n.columns - col));
          if (grid) {
            for (let k = 1; k < colSpan && ci + k < r.cells.length; k++) {
              if (r.cells[ci + k].blocks.map(text).join("").trim()) {
                colSpan = k;
                break;
              }
            }
          }
          const rowSpan = c.rowSpan || 1;
          for (let k = col; k < col + colSpan; k++) active[k] = ri + rowSpan;
          cells.push({ colSpan, rowSpan, blocks: convert(c.blocks, current) });
          if (grid) ci += colSpan - 1;
          else col += colSpan;
        }
        return { cells };
      });
      out.push({ type: "table", id: n.id, rows });
      continue;
    }
    const plain = text(n).trim();
    let runs = [];
    for (const r of n.runs) {
      if (r.image) {
        if (!omittedImages.has(current.id))
          omittedImages.set(current.id, new Set());
        omittedImages.get(current.id).add(r.image);
        continue;
      }
      if (!r.text) continue;
      const href = linkFor(r.link, r.text, current);
      runs.push({
        text: r.text,
        ...(r.bold ? { bold: true } : {}),
        ...(r.italic ? { italic: true } : {}),
        ...(r.sup ? { sup: true } : {}),
        ...(href ? { href } : {}),
      });
    }
    if (
      current.documentId === "1hvAYNvsiq2VOU3PsvkfIJqnXahZlC6ZPSs6MWR3pLbk" &&
      n.sourceIndex === 108373
    )
      runs = [
        {
          text: "Reaccept Quest After Turn-In: Tự nhận lại quest sau khi trả. Bật hoặc tắt tùy nhu cầu trong client.",
        },
      ];
    if (
      current.source.method === "text-export" &&
      /^Enhancement:.*Click here/i.test(plain)
    ) {
      const target = pages.find(
        (p) =>
          p.documentId === current.documentId &&
          p.slug === "class-enhancements",
      );
      if (target)
        runs = [
          { text: "Enhancement: " },
          {
            text: "Xem hướng dẫn Enhancement trên website",
            href: "/" + target.category + "/" + target.slug,
          },
        ];
    }
    if (current.source.method === "text-export")
      runs = runs.map((run) =>
        run.href
          ? run
          : {
              ...run,
              text: run.text.replace(
                /Click here/gi,
                "liên kết tham khảo đang bổ sung",
              ),
            },
      );
    if (!plain) continue;
    paragraphCount++;
    renderedIds.push(current.documentId + ":" + n.sourceIndex);
    const h = /^HEADING_([3-6])$/.exec(n.style);
    out.push({
      type: h ? "heading" : "paragraph",
      id: n.id,
      ...(h ? { level: Number(h[1]) } : {}),
      ...(n.bullet ? { listDepth: n.bullet.nestingLevel || 0 } : {}),
      runs,
    });
  }
  return out;
}
const catalog = [],
  search = {};
fs.rmSync("public/content/guides", { recursive: true, force: true });
fs.mkdirSync("public/content/guides", { recursive: true });
for (const p of pages) {
  let blocks = convert(p.rawNodes, p);
  const sections = [];
  let section = {
    id: "noi-dung",
    title: "Nội dung hướng dẫn",
    paragraphs: [],
    blocks: [],
  };
  for (const b of blocks) {
    if (
      b.type === "heading" &&
      b.level >= 3 &&
      b.runs
        .map((r) => r.text)
        .join("")
        .trim().length < 140
    ) {
      if (section.blocks.length) sections.push(section);
      section = {
        id: b.id,
        title: b.runs
          .map((r) => r.text)
          .join("")
          .trim(),
        paragraphs: [],
        blocks: [],
      };
    } else section.blocks.push(b);
  }
  if (section.blocks.length) sections.push(section);
  const children = pages.filter((c) =>
    p.level === 1 ? c.level === 2 && c.groupId === p.id : c.parentId === p.id,
  );
  if (children.length)
    sections.push({
      id: "cac-chu-de",
      title: "Các chủ đề trong chương",
      paragraphs: [],
      links: children.map((c) => ({
        title: c.title,
        url: "/" + c.category + "/" + c.slug,
      })),
    });
  if (!sections.length)
    sections.push({
      id: "cac-chu-de",
      title: "Các chủ đề trong chương",
      paragraphs: ["Chọn một chủ đề bên dưới để đọc hướng dẫn."],
      links: pages
        .filter(
          (c) =>
            c.documentId === p.documentId && c.id !== p.id && c.level === 1,
        )
        .map((c) => ({ title: c.title, url: "/" + c.category + "/" + c.slug })),
    });
  const allText = blocks.map(text).join("\n");
  const intro = allText
    .split("\n")
    .map((t) => t.trim())
    .find((t) => t.length > 50 && !/Click here/i.test(t));
  const summary = intro
    ? intro.length > 190
      ? intro.slice(0, 187).replace(/\s+\S*$/, "") + "…"
      : intro
    : `Hướng dẫn ${p.title} trong cẩm nang AQW Vietnam.`;
  const siblings = pages.filter(
    (s) =>
      s.documentId === p.documentId &&
      s.level === p.level &&
      s.groupId === p.groupId,
  );
  const si = siblings.indexOf(p);
  const pathTo = (s) =>
    s ? { title: s.title, url: "/" + s.category + "/" + s.slug } : undefined;
  const body = {
    sections,
    previous: pathTo(siblings[si - 1]),
    next: pathTo(siblings[si + 1]),
    missingImageCount: omittedImages.get(p.id)?.size || 0,
  };
  fs.writeFileSync(
    "public/content/guides/" + p.id + ".json",
    JSON.stringify(body),
  );
  const row = {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    summary,
    sourceTitle: p.sourceTitle,
    sourceHeadingId: p.sourceHeadingId,
    documentId: p.documentId,
    documentTitle: p.documentTitle,
    sourceGroup: byId.get(p.groupId)?.title || p.title,
    groupId: p.groupId,
    parentId: p.parentId,
    level: p.level,
    sourceModifiedAt: p.source.modifiedAt,
    sourceFormat: p.source.method || "structured-docs-api",
    readAt: p.source.readAt,
    readMinutes: Math.max(1, Math.ceil(allText.split(/\s+/).length / 350)),
    bodyUrl: "/content/guides/" + p.id + ".json",
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title,
      paragraphs: [],
    })),
    missingImageCount: body.missingImageCount,
  };
  catalog.push(row);
  search[p.id] = allText;
}
const summary = {
  generatedAt: new Date().toISOString(),
  documents: sources.map((s) => ({
    id: s.source.id,
    title: s.source.title,
    method: s.source.method || "structured-docs-api",
    nodes: s.nodes.length,
    images: s.images?.length ?? null,
    sourceHash: createHash("sha256")
      .update(JSON.stringify(s.nodes))
      .digest("hex"),
  })),
  pages: catalog.length,
  paragraphs: paragraphCount,
  tables: tableCount,
  internalLinks,
  unresolvedDocumentLinks: unresolved,
  excluded: removed,
  renderedSourceIds: renderedIds,
  bodyHash: createHash("sha256").update(JSON.stringify(catalog)).digest("hex"),
};
fs.writeFileSync(
  "src/content/imported/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
fs.writeFileSync("public/content/search-index.json", JSON.stringify(search));
fs.mkdirSync("docs", { recursive: true });
fs.writeFileSync("docs/import-coverage.json", JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify({
    pages: catalog.length,
    paragraphs: paragraphCount,
    tables: tableCount,
    internalLinks,
    unresolved: unresolved.length,
    excluded: removed.length,
  }),
);

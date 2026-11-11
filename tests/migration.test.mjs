import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const coverage = JSON.parse(
  fs.readFileSync("docs/import-coverage.json", "utf8"),
);
const catalog = JSON.parse(
  fs.readFileSync("src/content/imported/catalog.json", "utf8"),
);
const read = (p) => JSON.parse(fs.readFileSync("public" + p.bodyUrl, "utf8"));
const walk = (blocks, fn) => {
  for (const block of blocks) {
    fn(block);
    if (block.type === "table")
      for (const row of block.rows)
        for (const cell of row.cells) walk(cell.blocks, fn);
  }
};
test("every source paragraph is represented or explicitly excluded", () => {
  const included = new Set(coverage.renderedSourceIds);
  const excluded = new Set(
    coverage.excluded.map((e) => e.documentId + ":" + e.index),
  );
  let checked = 0;
  for (const file of fs
    .readdirSync("content-sources")
    .filter(
      (name) =>
        name.endsWith(".json") &&
        fs.statSync("content-sources/" + name).isFile(),
    )) {
    const source = JSON.parse(
      fs.readFileSync("content-sources/" + file, "utf8"),
    );
    const headings = new Set(
      catalog
        .filter((p) => p.documentId === source.source.id)
        .map((p) => p.sourceHeadingId),
    );
    walk(source.nodes, (n) => {
      if (n.type === "paragraph" && n.runs.some((r) => r.text?.trim())) {
        checked++;
        const id = source.source.id + ":" + n.sourceIndex;
        assert(
          included.has(id) || excluded.has(id) || headings.has(n.id),
          `Source paragraph lost: ${id}`,
        );
      }
    });
  }
  assert(checked > 24000);
  assert.equal(coverage.documents.length, 5);
});
test("native chapters have local bodies and no Google Docs navigation in article content", () => {
  assert.equal(catalog.length, coverage.pages);
  assert(catalog.length > 300);
  assert.equal(coverage.unresolvedDocumentLinks.length, 0);
  for (const page of catalog) {
    const body = read(page);
    assert(body.sections.length);
    for (const s of body.sections) {
      for (const link of s.links || [])
        assert(!link.url.includes("docs.google.com/document/"));
      walk(s.blocks || [], (b) => {
        if (b.type !== "table")
          for (const run of b.runs)
            assert(!run.href?.includes("docs.google.com/document/"), page.id);
      });
    }
  }
});
test("Boosted Items has full source examples and table cell values survive merged cells", () => {
  const boost = catalog.find((p) => p.slug === "general-boosted");
  const content = JSON.stringify(read(boost));
  assert.match(content, /1\.35/);
  assert.match(content, /2\.3625/);
  assert.match(content, /Stack Rule/);
  assert(coverage.tables >= 30);
  const indexed = JSON.parse(
    fs.readFileSync("public/content/search-index.json"),
  );
  assert(
    Object.values(indexed).some(
      (t) => t.includes("Overwhelmed Axe") && t.includes("250"),
    ),
  );
});
test("bot automation recipes are excluded from page bodies and search index", () => {
  const index = fs.readFileSync("public/content/search-index.json", "utf8");
  assert(
    !/Anti Counter Attack|Auto Zone cho Ultra Dage|Loader\/Grabber của bot/.test(
      index,
    ),
  );
  for (const page of catalog) {
    const content = JSON.stringify(read(page));
    assert(
      !/Anti Counter Attack|Auto Zone cho Ultra Dage|Loader\/Grabber của bot/.test(
        content,
      ),
    );
  }
  assert(coverage.excluded.some((e) => /Bot automation/.test(e.reason)));
});

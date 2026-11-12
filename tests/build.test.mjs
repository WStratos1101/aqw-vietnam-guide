import { isComingSoon } from "../src/lib/site-feature-access.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const routes = JSON.parse(fs.readFileSync("dist/routes.json", "utf8"));
const htmlFor = (route) =>
  fs.readFileSync(
    route === "/" ? "dist/index.html" : path.join("dist", route, "index.html"),
    "utf8",
  );
test('V11 Boss SSR has one selected preview, three valid recommendations and no source section',()=>{
 const bossRoutes=routes.filter(r=>r.startsWith('/ultra-boss/')&&r.split('/').length===3);
 assert.equal(bossRoutes.length,17);
 for(const route of bossRoutes){const html=htmlFor(route);
  assert.equal((html.match(/class="rpg-equipment-preview"/g)||[]).length,1,route);
  assert.match(html,/>TRANG BỊ ENDGAME<\/h2>/);
  assert.doesNotMatch(html,/<h2[^>]*>Nguồn tham khảo<\/h2>/);
  const section=html.match(/<section[^>]*boss-recommendations[\s\S]*?<\/section>/)?.[0];assert.ok(section,route);
  const links=[...section.matchAll(/class="ultra-boss-card" href="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(links.length,3);assert.equal(new Set(links).size,3);assert.ok(!links.includes(route));
  assert.ok(links.every(link=>routes.includes(link)));
 }
});
test("all published routes ship readable HTML, one h1 and metadata", () => {
  assert.equal(
    routes.length,
    JSON.parse(fs.readFileSync("src/content/imported/catalog.json", "utf8"))
      .length + 41 + JSON.parse(fs.readFileSync('src/content/ultra/recovery.json')).bosses.length + JSON.parse(fs.readFileSync('src/content/classes/calendar-extension.json')).profiles.length + JSON.parse(fs.readFileSync('src/content/challenges/catalog.json')).length + 2 + JSON.parse(fs.readFileSync('src/content/farm/index.json')).length,
  );
  assert.equal(new Set(routes).size, routes.length);
  for (const route of routes) {
    const html = htmlFor(route);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, route);
    assert.match(html, /<main/);
    assert.match(html, /<meta name="description" content="[^\"]{30}/);
    assert.match(html, /AQW Vietnam Guide/);
    assert(!html.includes('<div id="root"></div>'));
  }
});
test("internal links and article TOC targets resolve in prerendered pages", () => {
  for (const route of routes) {
    const html = htmlFor(route);
    const ids = new Set(
      [...html.matchAll(/\sid="([^\"]+)"/g)].map((m) => m[1]),
    );
    for (const [, href] of html.matchAll(/\shref="([^\"]+)"/g)) {
      if (href.startsWith("#"))
        assert(ids.has(href.slice(1)), `${route}: ${href}`);
      if (href.startsWith("/") && !href.startsWith("//")) {
        const target = href.split(/[?#]/)[0];
        assert(
          routes.includes(target) || fs.existsSync(path.join("dist", target)),
          `${route}: ${href}`,
        );
      }
    }
  }
});
test("unknown route artifact carries 404, recovery and noindex", () => {
  const html = fs.readFileSync("dist/404.html", "utf8");
  assert.match(html, /Lạc khỏi bản đồ/);
  assert.match(html, /name="robots" content="noindex"/);
  assert.match(html, /href="\/huong-dan"/);
});

test("migrated reader ships valid initial content and cross-page anchors resolve", () => {
  const catalog = JSON.parse(
    fs.readFileSync("src/content/imported/catalog.json", "utf8"),
  );
  const cache = new Map();
  const idsFor = (route) => {
    if (!cache.has(route)) {
      const html = htmlFor(route);
      cache.set(
        route,
        new Set([...html.matchAll(/\sid="([^\"]+)"/g)].map((m) => m[1])),
      );
    }
    return cache.get(route);
  };
  for (const page of catalog) {
    const route = "/" + page.category + "/" + page.slug;
    const html = htmlFor(route);
    const data = html.match(
      /<script id="aqw-page-data" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (isComingSoon(route)) {
      assert.match(html, /<h1>Thông tin đang được cập nhật<\/h1>/);
      assert.equal(data, null, route);
      continue;
    }
    assert(data, route);
    const seed = JSON.parse(data[1]);
    if (seed.classContent) {
      assert.equal(seed.classId, page.slug);
      assert(Array.isArray(seed.skills));
    } else assert(seed.sections.length);
    for (const [, href] of html.matchAll(/\shref="(\/[^\"]*#[^\"]+)"/g)) {
      const [target, id] = href.split("#");
      assert(idsFor(target).has(id), `${route}: missing anchor ${href}`);
    }
  }
  const boost = htmlFor("/trang-bi/general-boosted");
  assert.match(boost, /Thông tin đang được cập nhật/);
  assert.doesNotMatch(boost, /Stack Rule/);
  assert(!boost.split('id="nguon"')[0].includes("docs.google.com/document/"));
});

test("reader removes citation panels and obsolete topic return controls", () => {
  for (const route of routes.filter((r) => r.split("/").length === 3)) {
    const html = htmlFor(route).split('<script id="aqw-page-data"')[0];
    assert(!html.includes('id="nguon"'), route);
    assert(!html.includes('class="source-context"'), route);
    const count = (html.match(/class="guide-topic"/g) || []).length;
    if (count) {
      assert(html.includes('id="muc-chinh"'), route);
      assert.equal(
        (html.match(/class="topic-return" href="#muc-chinh"/g) || []).length,
        0,
        route,
      );
    }
  }
});
test("Legacy boss guide and equipment drafts are gated while the Ultra encounter remains available", () => {
  for (const route of ["/huong-dan/dage-the-dark-lord", "/trang-bi/blade-of-awe"]) {
    const html = htmlFor(route);
    assert.match(html, /<h1>Thông tin đang được cập nhật<\/h1>/);
    assert.doesNotMatch(html, /aqw-page-data|boss-showcase/);
  }
  const boss = htmlFor("/ultra-boss/ultra-dage");
  assert.match(boss, /DAGE THE DARK LORD/);
  assert.match(boss, /enemy-inspection/);
  assert.doesNotMatch(boss, /<img[^>]+https?:/);
});

test("Ultra routes render inspection tabs, scoped quest inputs and truthful asset placeholders", () => {
  const ultra = routes.filter((r) => r.startsWith("/ultra-boss"));
  assert.equal(ultra.length, 1+JSON.parse(fs.readFileSync('src/content/ultra/bosses.json')).length+JSON.parse(fs.readFileSync('src/content/ultra/recovery.json')).bosses.length);
  for (const route of ultra) {
    const html = htmlFor(route);
    assert(!html.includes("Quay lại mục chính"));
    assert(html.includes("Asset cần bổ sung") || html.includes("/images/aqw/"));
    assert(!html.match(/<img[^>]+https?:/));
  }
  const html = htmlFor("/ultra-boss/ultra-dage");
  assert.equal((html.match(/role="tab"/g) || []).length, 2);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 1);
  assert.match(html, /THÔNG SỐ/);
  assert.match(html, /KỸ NĂNG/);
  assert.match(html, /Thông số Monster/);
  assert.equal((html.match(/class="ultra-team-toggle"/g) || []).length, 2);
  assert.match(html, /Nhật ký tuần/);
  assert(!html.includes('Quest lặp không tính vào mốc vĩnh viễn'));
  assert.match(html, /aria-label="Cuộn lên đầu trang"/);
  assert.match(htmlFor("/ultra-boss/ultra-speaker"), /10\.000\.000/);
});

test("expanded Ultra guides prerender community content without remote image hotlinks", () => {
  for (const slug of [
    "ultra-ezrajal",
    "ultra-engineer",
    "ultra-tyndarius",
    "ultra-nulgath",
    "ultra-drago",
    "ultra-speaker",
  ]) {
    const html = htmlFor("/ultra-boss/" + slug);
    assert.match(html, /enemy-inspection/);
    assert.match(html, /boss-taunt/);
    assert.match(html, /aqw-page-data/);
    assert(!html.match(/<img[^>]+https?:/));
    assert(!html.includes("Tuyến trang bị đang được đối chiếu"));
  }
});

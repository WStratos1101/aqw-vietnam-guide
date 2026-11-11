import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { createHandler } from "../scripts/http-handler.mjs";
const handler = createHandler("dist");
function request(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const response = new Writable({
      write(chunk, encoding, done) {
        chunks.push(Buffer.from(chunk));
        done();
      },
    });
    response.writeHead = (status, headers) => {
      response.status = status;
      response.headers = headers;
    };
    response.on("finish", () =>
      resolve({
        status: response.status,
        headers: response.headers,
        body: Buffer.concat(chunks).toString(),
      }),
    );
    response.on("error", reject);
    handler({ url, method }, response);
  });
}
test("production handler protects locked guide and direct nested URLs", async () => {
  const r = await request("/he-thong/hanh-trang?q=bank");
  assert.equal(r.status, 200);
  assert.match(r.headers["Content-Type"], /text\/html/);
  assert.match(r.body, /Thông tin đang được cập nhật/);
  assert.doesNotMatch(r.body, /Inventory và Bank|aqw-page-data/);
  assert.equal((await request("/he-thong/old-bookmark")).status, 200);
  assert.equal(r.headers["Cache-Control"], "no-cache");
});
test("production handler returns HTTP 404 with readable recovery", async () => {
  const r = await request("/missing-route");
  assert.equal(r.status, 404);
  assert.match(r.body, /Lạc khỏi bản đồ/);
});
test("HEAD and static SVG asset responses", async () => {
  const head = await request("/", "HEAD");
  assert.equal(head.status, 200);
  assert.equal(head.body, "");
  const art = await request("/art/lore.svg");
  assert.equal(art.status, 200);
  assert.equal(art.headers["Content-Type"], "image/svg+xml");
  assert.match(art.body, /<svg/);
});
test("malformed and encoded traversal requests are rejected", async () => {
  assert.equal((await request("/%E0%A4%A")).status, 400);
  assert.equal((await request("/..%2fpackage.json")).status, 403);
});

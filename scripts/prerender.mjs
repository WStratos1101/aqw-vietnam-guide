import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
await build({
  entryPoints: ["src/server.tsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: ".build-tmp/server.mjs",
});
try {
  const { routes, render, bodyUrlForPath } = await import(
    pathToFileURL(path.resolve(".build-tmp/server.mjs")).href
  );
  const template = fs.readFileSync("dist/index.html", "utf8");
  const escape = (s) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  for (const route of [...routes, "/404"]) {
    globalThis.location = { pathname: route, search: "" };
    const bodyUrl = bodyUrlForPath(route);
    globalThis.__AQW_BODY__ = bodyUrl
      ? JSON.parse(fs.readFileSync("public" + bodyUrl, "utf8"))
      : undefined;
    const rendered = render(route);
    const target =
      route === "/"
        ? "dist/index.html"
        : route === "/404"
          ? "dist/404.html"
          : path.join("dist", route, "index.html");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    let html = template
      .replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>`)
      .replace(
        /<title>[^<]*<\/title>/,
        `<title>${escape(route === "/404" ? "Không tìm thấy trang | AQW Vietnam Guide" : rendered.title)}</title>`,
      )
      .replace(
        /(<meta name="description" content=")[^"]*/,
        `$1${escape(rendered.description)}`,
      );
    html = html
      .replace(
        /(<meta property="og:title" content=")[^"]*/,
        `$1${escape(rendered.title)}`,
      )
      .replace(
        /(<meta property="og:description" content=")[^"]*/,
        `$1${escape(rendered.description)}`,
      );
    if (globalThis.__AQW_BODY__)
      html = html.replace(
        "</body>",
        `<script id="aqw-page-data" type="application/json">${JSON.stringify(globalThis.__AQW_BODY__).replaceAll("<", "\u003c")}</script></body>`,
      );
    fs.writeFileSync(
      target,
      route === "/404"
        ? html.replace(
            "</head>",
            '<meta name="robots" content="noindex"/></head>',
          )
        : html,
    );
  }
  fs.writeFileSync("dist/routes.json", JSON.stringify(routes, null, 2));
  console.log(`Prerendered ${routes.length} routes and 404 HTML.`);
} finally {
  fs.rmSync(".build-tmp", { recursive: true, force: true });
}

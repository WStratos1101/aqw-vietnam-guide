import { comingSoonRoute } from "../src/lib/site-feature-access.mjs";
import fs from "node:fs";
import path from "node:path";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
};
export function createHandler(directory) {
  const root = path.resolve(directory);
  return (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const decoded = decodeURIComponent(url.pathname);
      let file = path.resolve(root, "." + decoded);
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory())
        file = path.join(file, "index.html");
      const lockedRoute = comingSoonRoute(decoded);
      if (!fs.existsSync(file) && lockedRoute) {
        file = path.join(root, lockedRoute, "index.html");
      }
      let status = 200;
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        status = 404;
        file = path.join(root, "404.html");
      }
      res.writeHead(status, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": url.pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      if (req.method === "HEAD") res.end();
      else {
        const stream = fs.createReadStream(file);
        stream.on("error", () => res.destroy());
        stream.pipe(res);
      }
    } catch {
      res.writeHead(400);
      res.end("Bad request");
    }
  };
}

import http from "node:http";
import fs from "node:fs";
import { createHandler } from "./http-handler.mjs";
const port = Number(process.env.PORT || 4173);
if (!fs.existsSync("dist/index.html")) throw Error("Run npm run build first.");
const server = http.createServer(createHandler("dist"));
server.on("error", (e) => {
  console.error("Không thể mở localhost:", e.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(`AQW Vietnam Guide production: http://127.0.0.1:${port}`),
);

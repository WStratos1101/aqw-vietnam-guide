import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
const assets = JSON.parse(
  await fs.readFile("src/data/aqw-assets.json", "utf8"),
);
const urls = [
  "https://aqwwiki.wikidot.com/",
  "https://www.aq.com/",
  ...new Set(
    assets
      .filter((a) => a.verificationStatus === "verified")
      .map((a) => a.originalImageUrl),
  ),
];
const results = [];
for (const url of urls) {
  const r = spawnSync(
    "curl",
    [
      "-ILsS",
      "--max-time",
      "20",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}|%{content_type}|%{url_effective}",
      url,
    ],
    { encoding: "utf8" },
  );
  const [status, mime, finalUrl] = r.stdout.trim().split("|");
  const kind =
    r.status === 6
      ? "dns_failure"
      : r.status === 7
        ? "connection_failure"
        : r.status === 35 || r.status === 60
          ? "tls_error"
          : r.status === 47
            ? "redirect_error"
            : status === "403" || status === "429"
              ? "source_access_limit"
              : Number(status) >= 400
                ? "http_error"
                : r.status
                  ? "request_error"
                  : "network_verified";
  results.push({
    url,
    status,
    mime,
    finalUrl,
    exitCode: r.status,
    kind,
    error: r.stderr,
    checkedAt: new Date().toISOString(),
  });
  if (status === "429") break;
}
await fs.writeFile("qa/network.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

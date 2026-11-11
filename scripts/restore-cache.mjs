import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
const store =
  process.env.AQW_PNPM_STORE ||
  path.join(os.homedir(), "Library/pnpm/store/v10");
const rootPackage = JSON.parse(fs.readFileSync("package.json"));
const pinned = { ...rootPackage.dependencies, ...rootPackage.devDependencies };
const lock = JSON.parse(fs.readFileSync("package-lock.json"));
const map = new Map();
for (const dir of fs.readdirSync(store + "/index"))
  for (const file of fs.readdirSync(store + "/index/" + dir)) {
    try {
      const data = JSON.parse(
        fs.readFileSync(store + "/index/" + dir + "/" + file),
      );
      if (data.name && data.version)
        map.set(data.name + "@" + data.version, data);
    } catch {}
  }
const done = new Set();
function restore(name, version, optional = false) {
  version =
    pinned[name] || lock.packages["node_modules/" + name]?.version || version;
  const key = map.has(name + "@" + version) ? name + "@" + version : undefined;
  if (!key) {
    if (optional) return;
    throw new Error(`Missing exact cached package: ${name}@${version}`);
  }
  if (done.has(key)) return;
  done.add(key);
  const data = map.get(key);
  const dest = "node_modules/" + name;
  fs.mkdirSync(dest, { recursive: true });
  for (const [file, meta] of Object.entries(data.files)) {
    const hash = Buffer.from(meta.integrity.split("-")[1], "base64").toString(
      "hex",
    );
    const source = path.join(
      store,
      "files",
      hash.slice(0, 2),
      hash.slice(2) + (meta.mode & 64 ? "-exec" : ""),
    );
    const target = path.join(dest, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const actualSource = fs.existsSync(source)
      ? source
      : source.replace(/-exec$/, "");
    const bytes = fs.readFileSync(actualSource);
    const [algorithm, expected] = meta.integrity.split("-");
    if (createHash(algorithm).update(bytes).digest("base64") !== expected) {
      throw new Error(`Cache integrity mismatch: ${name}/${file}`);
    }
    fs.writeFileSync(target + ".restore", bytes, { mode: meta.mode });
    fs.chmodSync(target + ".restore", meta.mode);
    fs.renameSync(target + ".restore", target);
  }
  const pkg = JSON.parse(fs.readFileSync(dest + "/package.json"));
  for (const [dep, range] of Object.entries({
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
  }))
    restore(dep, range, Object.hasOwn(pkg.optionalDependencies || {}, dep));
  if (pkg.bin) {
    fs.mkdirSync("node_modules/.bin", { recursive: true });
    for (const [bin, rel] of Object.entries(
      typeof pkg.bin === "string" ? { [name]: pkg.bin } : pkg.bin,
    )) {
      fs.chmodSync(path.join(dest, rel), 0o755);
      try {
        fs.symlinkSync(
          path.relative("node_modules/.bin", path.join(dest, rel)),
          "node_modules/.bin/" + bin,
        );
      } catch {}
    }
  }
}
const pkg = JSON.parse(fs.readFileSync("package.json"));
for (const [name, version] of Object.entries({
  ...pkg.dependencies,
  ...pkg.devDependencies,
}))
  restore(name, version);
console.log("Restored independent copies of", done.size, "cached packages");

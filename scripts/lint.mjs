import fs from "node:fs";
import ts from "typescript";
let failures = 0,
  files = 0;
function scan(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = dir + "/" + f.name;
    if (f.isDirectory()) scan(p);
    else if (/\.tsx?$/.test(p)) {
      files++;
      const source = ts.createSourceFile(
        p,
        fs.readFileSync(p, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        p.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      for (const err of source.parseDiagnostics) {
        console.error(p, ts.flattenDiagnosticMessageText(err.messageText, " "));
        failures++;
      }
      function visit(n) {
        if (
          ts.isJsxAttribute(n) &&
          n.name.getText(source) === "href" &&
          n.initializer &&
          ts.isStringLiteral(n.initializer) &&
          ["#", "javascript:void(0)"].includes(n.initializer.text)
        ) {
          console.error(p, "Decorative link");
          failures++;
        }
        if (
          ts.isJsxSelfClosingElement(n) &&
          n.tagName.getText(source) === "img" &&
          !n.attributes.properties.some(
            (a) => ts.isJsxAttribute(a) && a.name.getText(source) === "alt",
          )
        ) {
          console.error(p, "Missing alt");
          failures++;
        }
        ts.forEachChild(n, visit);
      }
      visit(source);
    }
  }
}
scan("src");
console.log(
  `${files} TypeScript files checked; ${failures} syntax/accessibility/link findings. This is a focused project linter, not ESLint.`,
);
process.exitCode = failures ? 1 : 0;

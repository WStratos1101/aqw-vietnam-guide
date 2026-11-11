import type { ImportedBody } from "../types/content";
declare global {
  var __AQW_BODY__: ImportedBody | undefined;
}
export function initialImportedBody(): ImportedBody | null {
  if (typeof document === "undefined") return globalThis.__AQW_BODY__ || null;
  const element = document.getElementById("aqw-page-data");
  if (!element) return null;
  try {
    return JSON.parse(element.textContent || "null");
  } catch {
    return null;
  }
}

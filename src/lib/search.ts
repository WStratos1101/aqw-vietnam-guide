import type { Entry } from "../types/content";
export const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
const cache = new WeakMap<
  Entry,
  { index: Record<string, string> | undefined; text: string }
>();
export function searchEntries(
  entries: Entry[],
  query: string,
  importedText?: Record<string, string>,
) {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return entries;
  return entries.filter((entry) => {
    let item = cache.get(entry);
    if (!item || item.index !== importedText) {
      item = {
        index: importedText,
        text: normalize(
          [
            entry.title,
            entry.summary,
            entry.category,
            entry.imported ? importedText?.[entry.imported.id] || "" : "",
            ...entry.sections.flatMap((s) => [
              s.title,
              ...s.paragraphs,
              ...(s.terms || []).flatMap((t) => [t.term, t.definition]),
              ...(s.links || []).map((link) => link.title),
            ]),
          ].join(" "),
        ),
      };
      cache.set(entry, item);
    }
    return tokens.every((token) => item.text.includes(token));
  });
}

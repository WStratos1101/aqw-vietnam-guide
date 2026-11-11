// Parse only source text that explicitly assigns a Class, never infer a loadout.
export function classSourceParser(names) {
  const key = Object.keys(names).sort((a,b)=>b.length-a.length).join('|');
  const list = `(?:${key})(?:(?:\\s*[/,]\\s*|\\s+và\\s+)(?:${key}))*`;
  const aliases = text => [...new Set(text.match(new RegExp(`\\b(?:${key})\\b`,'g')) || [])];
  return {
    header(text) { return aliases(text.match(new RegExp(`^→\\s*(${list})(?=\\s|$)`))?.[1] || ''); },
    references(text) {
      const pattern = new RegExp(`(${list})\\s+(?:(?:sử dụng|sử dung|dùng)\\s+)?(?:tương tự(?:\\s+như|\\s+với)?|như)\\s+Team\\s+(\\d+)`, 'g');
      return [...text.matchAll(pattern)].map(m=>({aliases:aliases(m[1]),team:'source-team-'+m[2],note:text}));
    }
  };
}

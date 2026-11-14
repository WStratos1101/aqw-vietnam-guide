// Keep complete conditional clauses together; never turn "only if" into an unconditional instruction.
export function comboContext(text) {
  const timing = [],
    conditions = [];
  for (const line of (text || "")
    .split(/\n+|(?<=[.!?;])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean)) {
    (/\b(?:mana|hp|buff|debuff|stack|target|vantage)\b|nếu|khi đủ|chỉ dùng|chỉ sử dụng|điều kiện|duy trì|mục tiêu|hết|còn|thiếu|tích tầng|đạt /i.test(
      line,
    )
      ? conditions
      : timing
    ).push(line);
  }
  return { timing, conditions };
}

import itemSets from "../../src/content/classes/calendar-items.json" with { type: "json" };
export function applyCalendarItemScope(classId, skill) {
  const year = /^calendar-(?:corrupted|timeless)-chronomancer$/.test(classId)
    ? "2019"
    : /^calendar-(?:underworld|overworld)-chronomancer$/.test(classId)
      ? "2020"
      : null;
  if (!year) return;
  const forbidden =
    year === "2019"
      ? /Timepiece of (?:Madness|Inevitability|Pestilence)/i
      : /(?:Entropic|Foresee|Infinite) Corruption/i;
  const excluded = (skill.effects || []).filter((row) =>
    forbidden.test(row.text),
  );
  const kept = (skill.effects || []).filter((row) => !forbidden.test(row.text));
  const corrected = [];
  const foresee = itemSets["2019"].items.find(
    (item) => item.name === "Foresee Corruption",
  );
  skill.effects = kept.map((row) => {
    if (
      year === "2019" &&
      /Foresee Corruption/.test(row.text) &&
      /giảm 500% sát thương nhận vào/.test(row.text) &&
      foresee.details.some((text) => text.includes("giảm 80% sát thương nhận"))
    ) {
      corrected.push({ previous: row.text, source: foresee.wiki });
      return {
        ...row,
        text: row.text.replace(
          "giảm 500% sát thương nhận vào",
          "giảm 80% sát thương nhận vào",
        ),
      };
    }
    return row;
  });
  if (excluded.length || corrected.length)
    skill.calendarItemScope = {
      year,
      excluded,
      corrected,
      sources: itemSets[year].items.map((item) => item.wiki),
    };
}

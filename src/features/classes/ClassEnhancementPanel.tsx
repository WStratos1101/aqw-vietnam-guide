import { useEffect, useMemo, useState } from "react";
import { Sparkles, Swords, Shield, Flag, BookOpen } from "lucide-react";
import {
  enhancementOptions,
  enhancementSourceUrl,
  findClassEnhancements,
  forgeAvailable,
} from "./enhancement-data";
import type { SourceEnhancementRecord, EnhancementSlot } from "./enhancement-data";

const slots: Array<{ id: EnhancementSlot; title: string; Icon: typeof Swords }> = [
  { id: "weapon", title: "Weapon", Icon: Swords },
  { id: "helm", title: "Helm", Icon: Shield },
  { id: "cape", title: "Cape", Icon: Flag },
];

export function ClassEnhancementPanel({
  profile,
  variantName,
}: {
  profile: { id: string; name: string };
  variantName?: string;
}) {
  const match = useMemo(
    () => findClassEnhancements(profile, variantName),
    [profile.id, profile.name, variantName],
  );
  const row = match.row;
  const hasForge = row ? forgeAvailable(row) : false;
  const [mode, setMode] = useState<"forge" | "awe">(hasForge ? "forge" : "awe");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Record<EnhancementSlot, string>>({
    weapon: "", helm: "", cape: "",
  });

  const classChoices = row
    ? enhancementOptions(mode === "forge" && hasForge ? row.class : row.base)
    : [];
  const optionsFor = (slot: EnhancementSlot, data: SourceEnhancementRecord) => {
    if (mode === "awe") return slot === "weapon" ? enhancementOptions(data.aweWeapon) : [];
    return enhancementOptions(data[slot]);
  };
  const identity = `${profile.id}::${variantName ?? ""}::${row?.sheetRow ?? "unknown"}`;
  useEffect(() => {
    setMode(hasForge ? "forge" : "awe");
    setSelectedClass("");
    setSelectedSlots({ weapon: "", helm: "", cape: "" });
  }, [identity, hasForge]);
  useEffect(() => {
    if (!classChoices.includes(selectedClass)) setSelectedClass(classChoices[0] ?? "");
    setSelectedSlots({ weapon: "", helm: "", cape: "" });
  }, [mode, row?.sheetRow, selectedClass]);

  if (!row) {
    return (
      <div className="aqw-class-enh" data-class-enhancement="unverified">
        <h2>Enhancement</h2>
        <p>Chưa có dòng Enhancement khớp chính xác với <strong>{variantName || profile.name}</strong>.</p>
        <p>Không tự gán cấu hình của Class khác hoặc biến thể khác.</p>
        <a href={enhancementSourceUrl} target="_blank" rel="noreferrer">Đối chiếu bảng nguồn</a>
      </div>
    );
  }

  return (
    <section className="aqw-class-enh" data-class-enhancement={row.name}>
      <div className="aqw-class-enh__heading">
        <div>
          <span className="aqw-class-enh__eyebrow"><Sparkles size={15} aria-hidden="true" /> CLASS BUILD / WIKI GUIDE</span>
          <h2>Enhancement</h2>
          <p>Chọn loại Enhancement cho <strong>{row.name}</strong>, sau đó xem các lựa chọn từng slot.</p>
        </div>
        <a href={enhancementSourceUrl} target="_blank" rel="noreferrer">Nguồn dữ liệu ↗</a>
      </div>
      <div className="aqw-class-enh__modes" role="group" aria-label="Chế độ Enhancement">
        <button type="button" aria-pressed={mode === "forge"} disabled={!hasForge} onClick={() => setMode("forge")}>Forge</button>
        <button type="button" aria-pressed={mode === "awe"} onClick={() => setMode("awe")}>Awe / Chưa có Forge</button>
      </div>
      {!hasForge && <p className="aqw-class-enh__note">Nguồn chưa có cấu hình Forge riêng cho Class này. Đang hiển thị Base và Awe.</p>}
      <div className="aqw-class-enh__class">
        <h3><BookOpen size={18} aria-hidden="true" /> Class Enhancement <small>{mode === "awe" || !hasForge ? "(Base)" : "(Forge)"}</small></h3>
        {classChoices.length ? (
          <div className="aqw-class-enh__choices" role="group" aria-label="Lựa chọn Class Enhancement">
            {classChoices.map((choice) => (
              <button key={choice} type="button" aria-pressed={selectedClass === choice} onClick={() => setSelectedClass(choice)}>{choice}</button>
            ))}
          </div>
        ) : <p className="aqw-class-enh__unknown">Chưa có khuyến nghị Class trong bảng nguồn.</p>}
      </div>
      <div className="aqw-class-enh__grid">
        {slots.map(({id, title, Icon}) => {
          const choices = optionsFor(id, row);
          const selected = choices.includes(selectedSlots[id]) ? selectedSlots[id] : (choices[0] ?? "");
          return (
            <section key={`${identity}:${mode}:${id}`} className="aqw-class-enh__slot">
              <h3><Icon size={19} aria-hidden="true" /> {title}</h3>
              {choices.length ? (
                <div className="aqw-class-enh__choices" role="group" aria-label={`Lựa chọn ${title} Enhancement`}>
                  {choices.map((choice) => (
                    <button key={choice} type="button" aria-pressed={selected === choice} onClick={() => setSelectedSlots((prev) => ({...prev, [id]: choice}))}>{choice}</button>
                  ))}
                </div>
              ) : (
                <p className="aqw-class-enh__unknown">{mode === "awe" && id !== "weapon" ? "Bảng nguồn chưa đề xuất slot này cho Awe." : "Chưa có dữ liệu xác minh."}</p>
              )}
            </section>
          );
        })}
      </div>
      <p className="aqw-class-enh__note">
        Các lựa chọn Weapon, Helm và Cape được ghi độc lập trong spreadsheet; việc chọn Class Enhancement không có nghĩa nguồn đã xác nhận một combo slot duy nhất. Không tự suy diễn các build ghép cặp.
      </p>
      <p className="aqw-class-enh__credit">Nguồn: AQW Class Enhancements · dòng {row.sheetRow} · snapshot ngày 18/11/2026.</p>
    </section>
  );
}

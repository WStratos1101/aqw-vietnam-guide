import { Hourglass, Zap, Flame, ShieldAlert, CircleHelp } from "lucide-react";
import { useState } from "react";
import type { ClassSkill } from "../../types/classes";
import { SkillSequenceFlow } from "./SkillSequenceFlow";
import "../../styles/classes/calendar-v020.css";

type ClassItem = { name: string; summary: string; wiki: string; image: string; group: "hourglass" | "other" };
const img = (file: string) => `https://aqwwiki.wdfiles.com/local--files/maul-test/${file}.png`;
// Wiki shop inventory and Artix design notes: 3 Hourglasses + 3 Corruptions/Timepieces per year.
// Full artwork currently lives on AQW Wiki; external thumbnails fall back to vector silhouettes if blocked.
const itemSets: Record<string, { heading: string; second: string; items: ClassItem[] }> = {
  "2019": {
    heading: "Corrupted / Timeless Chronomancer",
    second: "Corruptions",
    items: [
      { name: "Hourglass of Power", summary: "Buff chỉ số tấn công, Haste và phòng thủ khi dùng Hourglass Inversion.", wiki: "https://aqwwiki.wikidot.com/class-item-hourglass-of-power-1", image: img("XZXyEt1"), group: "hourglass" },
      { name: "Hourglass of Paradise", summary: "Chuyển trạng thái hồi HP/MP và giảm sát thương nhận; đi kèm đánh đổi sức tấn công.", wiki: "https://aqwwiki.wikidot.com/class-item-hourglass-of-paradise-1", image: img("VvlZhav"), group: "hourglass" },
      { name: "Hourglass of Transience", summary: "Transient → Ephemeral: tăng Dodge và sát thương, hoặc ổn định để tăng END/Haste.", wiki: "https://aqwwiki.wikidot.com/class-item-hourglass-of-transience-1", image: img("JqMw9Pc"), group: "hourglass" },
      { name: "Entropic Corruption", summary: "Tăng sát thương và Haste, giảm mana cost; đồng thời tăng sát thương bản thân phải chịu.", wiki: "https://aqwwiki.wikidot.com/class-item-entropic-corruption", image: img("eIt0FA3"), group: "other" },
      { name: "Foresee Corruption", summary: "Chuẩn bị Foresee → Seer → Change the Future cho cửa sổ burst/phòng thủ.", wiki: "https://aqwwiki.wikidot.com/class-item-foresee-corruption", image: img("alIILY7"), group: "other" },
      { name: "Infinite Corruption", summary: "Auto Attack tạo DoT tích tầng; Hourglass Inversion bổ sung Heal-over-Time.", wiki: "https://aqwwiki.wikidot.com/class-item-infinite-corruption", image: img("7wzs74C"), group: "other" },
    ],
  },
  "2020": {
    heading: "Underworld / Overworld Chronomancer",
    second: "Timepieces",
    items: [
      { name: "Hourglass of Power", summary: "Hourglass Reversal bổ sung các buff chỉ số tấn công, Haste và phòng thủ.", wiki: "https://aqwwiki.wikidot.com/class-item-hourglass-of-power-2", image: img("iSBAg19"), group: "hourglass" },
      { name: "Hourglass of Paradise", summary: "Cung cấp khả năng hồi phục/phòng thủ kèm điều kiện đánh đổi sát thương.", wiki: "https://aqwwiki.wikidot.com/class-item-hourglass-of-paradise-2", image: img("8Rjo8lM"), group: "hourglass" },
      { name: "Hourglass of Transience", summary: "Tạo Transient/Ephemeral; cân bằng burst và hiệu ứng bất lợi theo thời gian.", wiki: "https://aqwwiki.wikidot.com/class-item-hourglass-of-transience-2", image: img("87udHB5"), group: "hourglass" },
      { name: "Timepiece of Inevitability", summary: "Tăng damage/Haste; kích hoạt Snap khi đã có Inevitable Corruption.", wiki: "https://aqwwiki.wikidot.com/class-item-timepiece-of-inevitability", image: img("u48JhkW"), group: "other" },
      { name: "Timepiece of Madness", summary: "Tích Mad bằng đòn đánh; đạt ngưỡng sẽ chuyển thành Eternal tăng cơ hội Crit.", wiki: "https://aqwwiki.wikidot.com/class-item-timepiece-of-madness", image: img("KxGAWee"), group: "other" },
      { name: "Timepiece of Pestilence", summary: "Tăng sát thương kẻ địch nhận, áp DoT/Decay; có đánh đổi về sát thương nhận.", wiki: "https://aqwwiki.wikidot.com/class-item-timepiece-of-pestilence", image: img("sMcKSyz"), group: "other" },
    ],
  },
};
function yearFor(classId?: string) {
  if (/^calendar-(?:corrupted|timeless)-chronomancer$/.test(classId ?? "")) return "2019";
  if (/^calendar-(?:underworld|overworld)-chronomancer$/.test(classId ?? "")) return "2020";
  return null;
}
function IconArt({ item }: { item: ClassItem }) {
  const [broken, setBroken] = useState(false);
  const Icon = item.group === "hourglass" ? Hourglass : Zap;
  return <span className="calendar-item-icon"><Icon size={23} aria-hidden="true" />{!broken && <img src={item.image} alt="" loading="lazy" onError={() => setBroken(true)} />}</span>;
}
export function CalendarConsumables({ classId }: { classId?: string }) {
  const year = yearFor(classId);
  if (!year) return null;
  const data = itemSets[year];
  return <section className="calendar-item-guide" aria-label={`Class Items ${year}`}>
    <header><h3>Class Items · {data.heading}</h3><small>{year} · 6 items</small></header>
    <p>Chọn một Hourglass làm nền trước trận, sau đó kết hợp một {year === "2019" ? "Corruption" : "Timepiece"}. Item không thay thế Skill 1–5; hiệu ứng tùy thuộc Class đang dùng.</p>
    <div className="calendar-item-groups">
      {(["hourglass", "other"] as const).map(group => <div className="calendar-item-group" key={group}>
        <h4>{group === "hourglass" ? "Hourglasses · 3" : `${data.second} · 3`}</h4>
        <ul className="calendar-item-list">{data.items.filter(item => item.group === group).map(item => <li key={item.name}>
          <IconArt item={item}/><div><strong><a href={item.wiki} target="_blank" rel="noreferrer">{item.name}</a></strong><small>{item.summary}</small></div>
        </li>)}</ul>
      </div>)}
    </div>
  </section>;
}
function findSetupItems(classId: string, comboTitle: string, sourceText: string): ClassItem[] {
  const year = yearFor(classId);
  if (!year) return [];
  const items = itemSets[year].items;
  const source = sourceText.toLowerCase();
  const title = comboTitle.toLowerCase();
  const matches = (item: ClassItem, text: string) => {
    const short = item.name.replace(/^Hourglass of |^Timepiece of /i, "").toLowerCase();
    return text.includes(item.name.toLowerCase()) || new RegExp(`\\b${short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
  };
  // Each setup step only displays items it actually activates. A generic
  // "Hourglass" instruction may take the concrete Hourglass from the combo title.
  const hourglass = items.find(item => item.group === "hourglass" && matches(item, source)) ||
    (/hourglass/i.test(source) ? items.find(item => item.group === "hourglass" && matches(item, title)) : undefined);
  const other = items.find(item => item.group === "other" && matches(item, source)) ||
    (/corruption|timepiece/i.test(source) ? items.find(item => item.group === "other" && matches(item, title)) : undefined);
  return [hourglass, other].filter((item): item is ClassItem => !!item);
}
export function CalendarSetup({ classId, comboTitle, text }: { classId?: string; comboTitle: string; text: string }) {
  const year = yearFor(classId);
  if (!year) return <p>{text}</p>;
  const items = findSetupItems(classId!, comboTitle, text);
  if (!items.length) return <p>{text}</p>;
  return <div className="calendar-item-setup" aria-label="Class items dùng để khởi động combo">
    <small>Chuẩn bị:</small>{items.map(item => <span key={item.name} className="calendar-item-chip"><IconArt item={item}/>{item.name}</span>)}
  </div>;
}
export function AbyssalConditionIcons({ classId, text, skills, onSelect }: { classId?: string; text: string; skills: ClassSkill[]; onSelect?: (skill: ClassSkill) => void }) {
  if (!/abyssal.angel/i.test(classId ?? "") || !/vantage.point/i.test(text)) return null;
  const cases = [
    { slot: 3, when: "Còn Vantage Point", effect: "Skill 3 → Stun", Icon: ShieldAlert },
    { slot: 3, when: "Hết Vantage Point", effect: "Skill 3 → Haste", Icon: Zap },
    { slot: 5, when: "Thiếu mana", effect: "Ngừng dùng skill 5", Icon: Flame },
    { slot: 4, when: "Cần hồi máu", effect: "Dùng skill 4", Icon: CircleHelp },
  ];
  return <div className="combo-conditional-guide" aria-label="Điều kiện dùng skill">
    {cases.map(({slot,when,effect,Icon},i) => <div key={i}><span><Icon size={13} aria-hidden="true" /> {when}</span><SkillSequenceFlow sequence={[slot]} skills={skills} label={effect} onSelect={skill => onSelect?.(skill)}/><strong>{effect}</strong></div>)}
  </div>;
}

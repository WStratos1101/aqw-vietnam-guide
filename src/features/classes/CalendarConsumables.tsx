import calendarItemData from "../../content/classes/calendar-items.json";
import {
  Zap,
  Flame,
  ShieldAlert,
  CircleHelp,
  Hourglass,
  FlameKindling,
  Clock,
} from "lucide-react";
import { useId, useState } from "react";
import type { ClassSkill } from "../../types/classes";
import { SkillSequenceFlow } from "./SkillSequenceFlow";
import "../../styles/classes/calendar-v020.css";

type ClassItem = {
  name: string;
  summary: string;
  details: string[];
  wiki: string;
  image?: string;
  imageStatus?: string;
  group: "hourglass" | "other";
};

// Wiki shop inventory and Artix design notes: 3 Hourglasses + 3 Corruptions/Timepieces per year.
// Item-specific Wiki artwork is documented in docs/calendar-item-art.md.
// No image is assigned until its bytes can be downloaded and visually verified locally.
const itemSets = calendarItemData as Record<
  string,
  { heading: string; second: string; items: ClassItem[] }
>;

function yearFor(classId?: string) {
  if (/^calendar-(?:corrupted|timeless)-chronomancer$/.test(classId ?? ""))
    return "2019";
  if (/^calendar-(?:underworld|overworld)-chronomancer$/.test(classId ?? ""))
    return "2020";
  return null;
}
export function IconArt({ item }: { item: ClassItem }) {
  const [failedImage, setFailedImage] = useState<string>();
  const Icon =
    item.group === "hourglass"
      ? Hourglass
      : /Corruption$/.test(item.name)
        ? FlameKindling
        : Clock;
  return (
    <span className="calendar-item-icon">
      {item.image && failedImage !== item.image ? (
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          width={42}
          height={42}
          onError={() => setFailedImage(item.image)}
        />
      ) : (
        <span
          role="img"
          aria-label={`${item.name}: biểu tượng loại item, ảnh chưa xác minh`}
          title="Biểu tượng loại item · ảnh item chưa xác minh"
        >
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
export function CalendarConsumables({ classId }: { classId?: string }) {
  const [selection, setSelection] = useState<Record<string, string>>({});
  const id = useId();
  const year = yearFor(classId);
  if (!year) return null;
  const data = itemSets[year];
  return (
    <section className="calendar-item-guide" aria-label={`Class Items ${year}`}>
      <header>
        <h3>Class Items · {data.heading}</h3>
        <small>
          {year} · {data.items.length} items
        </small>
      </header>
      <p>
        Chọn một Hourglass làm nền trước trận, sau đó kết hợp một{" "}
        {year === "2019" ? "Corruption" : "Timepiece"}. Item không thay thế
        Skill 1–5; hiệu ứng tùy thuộc Class đang dùng.
      </p>
      <div className="calendar-item-groups">
        {(["hourglass", "other"] as const).map((group) => (
          <div className="calendar-item-group" key={group}>
            <h4>
              {group === "hourglass"
                ? `Hourglasses · ${data.items.filter((i) => i.group === group).length}`
                : `${data.second} · ${data.items.filter((i) => i.group === group).length}`}
            </h4>
            <ul className="calendar-item-list">
              {data.items
                .filter((item) => item.group === group)
                .map((item) => (
                  <li key={item.name}>
                    <button
                      type="button"
                      className="calendar-item-choice"
                      aria-label={`Chọn ${item.name}`}
                      aria-expanded={
                        selection[`${year}-${group}`] === item.name
                      }
                      aria-controls={`${id}-${group}-${data.items.indexOf(item)}`}
                      aria-pressed={selection[`${year}-${group}`] === item.name}
                      onClick={() =>
                        setSelection((current) => ({
                          ...current,
                          [`${year}-${group}`]:
                            current[`${year}-${group}`] === item.name
                              ? ""
                              : item.name,
                        }))
                      }
                    >
                      <IconArt item={item} />
                      <strong>{item.name}</strong>
                    </button>
                    <div>
                      <small>{item.summary}</small>
                    </div>
                    {selection[`${year}-${group}`] === item.name && (
                      <div
                        className="calendar-item-detail"
                        id={`${id}-${group}-${data.items.indexOf(item)}`}
                      >
                        <ul>
                          {item.details.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                        {!item.image && (
                          <p>Ảnh item: chưa tải được nguồn xác minh.</p>
                        )}
                        <a href={item.wiki} target="_blank" rel="noreferrer">
                          AQW Wiki
                        </a>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
function findSetupItems(
  classId: string,
  comboTitle: string,
  sourceText: string,
): ClassItem[] {
  const year = yearFor(classId);
  if (!year) return [];
  const items = itemSets[year].items;
  const source = sourceText.toLowerCase();
  const title = comboTitle.toLowerCase();
  const matches = (item: ClassItem, text: string) => {
    const short = item.name
      .replace(/^Hourglass of |^Timepiece of /i, "")
      .toLowerCase();
    return (
      text.includes(item.name.toLowerCase()) ||
      new RegExp(
        `\\b${short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i",
      ).test(text)
    );
  };
  // Each setup step only displays items it actually activates. A generic
  // "Hourglass" instruction may take the concrete Hourglass from the combo title.
  const hourglass =
    items.find((item) => item.group === "hourglass" && matches(item, source)) ||
    (/hourglass/i.test(source)
      ? items.find((item) => item.group === "hourglass" && matches(item, title))
      : undefined);
  const other =
    items.find((item) => item.group === "other" && matches(item, source)) ||
    (/corruption|timepiece/i.test(source)
      ? items.find((item) => item.group === "other" && matches(item, title))
      : undefined);
  return [hourglass, other]
    .filter((item): item is ClassItem => !!item)
    .sort(
      (a, b) =>
        source.indexOf(a.name.toLowerCase()) -
        source.indexOf(b.name.toLowerCase()),
    );
}
export function CalendarSetup({
  classId,
  comboTitle,
  text,
}: {
  classId?: string;
  comboTitle: string;
  text: string;
}) {
  const year = yearFor(classId);
  if (!year) return <p>{text}</p>;
  const items = findSetupItems(classId!, comboTitle, text);
  if (!items.length) return <p>{text}</p>;
  return (
    <div
      className="calendar-item-setup"
      aria-label="Class items dùng để khởi động combo"
    >
      <small>
        {/lại/i.test(text)
          ? "Dùng lại tại bước này:"
          : /trang bị/i.test(text)
            ? "Trước trận: kích hoạt → trang bị"
            : "Dùng tại bước này:"}
      </small>
      {items.map((item) => (
        <span key={item.name} className="calendar-item-chip">
          <IconArt item={item} />
          {item.name}
        </span>
      ))}
    </div>
  );
}
export function AbyssalConditionIcons({
  classId,
  text,
  skills,
  onSelect,
}: {
  classId?: string;
  text: string;
  skills: ClassSkill[];
  onSelect?: (skill: ClassSkill) => void;
}) {
  if (!/abyssal.angel/i.test(classId ?? "")) return null;
  const cases = [
    {
      slot: 3,
      when: "Còn Vantage Point",
      effect: "Skill 3 → Stun",
      Icon: ShieldAlert,
    },
    {
      slot: 3,
      when: "Hết Vantage Point",
      effect: "Skill 3 → Haste",
      Icon: Zap,
    },
    { slot: 5, when: "Thiếu mana", effect: "Ngừng dùng skill 5", Icon: Flame },
    { slot: 4, when: "Cần hồi máu", effect: "Dùng skill 4", Icon: CircleHelp },
  ];
  const supported = cases.filter(({ slot }) =>
    slot === 3
      ? /vantage.point/i.test(text)
      : slot === 5
        ? /mana.*ngưng sử dụng 5/i.test(text)
        : /heal.*sử dụng 4/i.test(text),
  );
  if (!supported.length) return null;
  return (
    <div className="combo-conditional-guide" aria-label="Điều kiện dùng skill">
      {supported.map(({ slot, when, effect, Icon }, i) => (
        <div key={i}>
          <span>
            <Icon size={13} aria-hidden="true" /> {when}
          </span>
          <SkillSequenceFlow
            sequence={[slot]}
            skills={skills}
            label={effect}
            onSelect={(skill) => onSelect?.(skill)}
          />
          <strong>{effect}</strong>
        </div>
      ))}
    </div>
  );
}

import type { FarmV2Item, FarmV2RouteData } from "../../types/farm-v2";
import "./farm-compact.css";
import { CircleDot, Hand, WandSparkles } from "lucide-react";

const statMeaning: Record<string, string> = {
  "Offensive Caster": "Thiên về phép tấn công",
  "Defensive Caster": "Thiên về phép phòng thủ",
  "Tank Melee": "Cận chiến chống chịu",
  "Dodge Melee": "Cận chiến né đòn",
  "Full Hybrid": "Kết hợp toàn diện",
};

function normalized(value: string) {
  return value.toLocaleLowerCase("vi").replace(/\s+/g, " ").replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

/** Prefer the more informative variant only when both values describe the same field. */
function asText(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : typeof value === "number" && Number.isFinite(value) ? String(value) : null;
}

function preferredValue(first: unknown, second: unknown) {
  const values = [first, second].map(asText).filter((value): value is string => Boolean(value));
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  if (normalized(values[0]) === normalized(values[1])) return values[0].length >= values[1].length ? values[0] : values[1];
  // Conflicting source values must not be silently collapsed.
  return values[0];
}

export function FarmWikiInfo({ item, route }: { item: FarmV2Item; route?: FarmV2RouteData }) {
  const d = item.wikiDetails;
  const metadata = item as unknown as Record<string, unknown>;
  const typeHints = [metadata.type, metadata.subtype, metadata.itemType, metadata.category, metadata.name].filter((value) => typeof value === "string").join(" ").toLowerCase();
  const ItemIcon = /gauntlets?|gloves?/.test(typeHints) ? Hand : /wands?/.test(typeHints) ? WandSparkles : /grounds?|floor|sigil/.test(typeHints) ? CircleDot : null;
  const price = route?.purchase
    ? `${route.purchase.amount.toLocaleString("en-US")} ${route.purchase.currency}`
    : route?.questReward
      ? `Hoàn thành Quest: ${route.questReward}`
      : route?.method === "Merge" ? "Merge" : null;
  const candidates: [string, unknown][] = [
    ["Nơi nhận", preferredValue(route?.location, d?.location)],
    ["Phương thức / Giá mua", preferredValue(price, d?.priceRaw || route?.method)],
    ["Giá bán lại", preferredValue(d?.sellback, item.sellback)],
    ["Sát thương vũ khí", d?.weaponDamage],
    ["Tốc độ", d?.speed ? d.speed + " speed" : null],
    ["Enhancement khuyến nghị", d?.enhancement],
    ["Mô hình chỉ số", d?.statModel ? d.statModel + (statMeaning[d.statModel] ? " · " + statMeaning[d.statModel] : "") : null],
  ];
  const fieldKeys = new Set<string>();
  const fields = candidates
    .map(([key, value]) => [key, asText(value)] as [string, string | null])
    .filter(([key, value]) => {
    if (!value) return false;
    const dedupeKey = normalized(key);
    if (fieldKeys.has(dedupeKey)) return false;
    fieldKeys.add(dedupeKey);
    return true;
  });
  const hasBody = fields.length > 0 || Boolean(d?.descriptionVi) || Boolean(item.classHref);
  if (!hasBody) return null;
  return (
    <div className="fv31-wiki-info aqw-cp-wiki">
      <details>
        <summary><span className="aqw-cp-label">{ItemIcon && <ItemIcon size={18} aria-hidden="true" />}Thông tin vật phẩm</span><small>Nhấn để mở hoặc thu gọn</small></summary>
        <div className="aqw-cp-body">
          {fields.length > 0 && <dl className="fv31-wiki-fields">
            {fields.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>}
          {d?.descriptionVi && <section><h3>Mô tả</h3><p>{d.descriptionVi}</p></section>}
          {item.classHref && <a href={item.classHref}>Xem kỹ năng và combo Class</a>}
        </div>
      </details>
    </div>
  );
}

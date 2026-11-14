import type { FarmV2Item, FarmV2RouteData } from "../../types/farm-v2";
const statMeaning: Record<string, string> = {
  "Offensive Caster": "Thiên về phép tấn công",
  "Defensive Caster": "Thiên về phép phòng thủ",
  "Tank Melee": "Cận chiến chống chịu",
  "Dodge Melee": "Cận chiến né đòn",
  "Full Hybrid": "Kết hợp toàn diện",
};
export function FarmWikiInfo({
  item,
  route,
}: {
  item: FarmV2Item;
  route?: FarmV2RouteData;
}) {
  const d = item.wikiDetails;
  const price = route?.purchase
    ? `${route.purchase.amount.toLocaleString("en-US")} ${route.purchase.currency}`
    : route?.questReward
      ? `Hoàn thành Quest: ${route.questReward}`
      : route?.method === "Merge"
        ? "Merge"
        : null;
  const fields = [
    ["Nơi nhận", route?.location || d?.location],
    ["Phương thức / Giá mua", price || d?.priceRaw || route?.method],
    ["Giá bán lại", d?.sellback || item.sellback],
    ["Sát thương vũ khí", d?.weaponDamage],
    ["Tốc độ", d?.speed ? d.speed + " speed" : null],
    ["Enhancement khuyến nghị", d?.enhancement],
    [
      "Mô hình chỉ số",
      d?.statModel
        ? d.statModel +
          (statMeaning[d.statModel] ? " · " + statMeaning[d.statModel] : "")
        : null,
    ],
  ].filter(([, v]) => v);
  return (
    <div className="fv31-wiki-info">
      {fields.length > 0 && (
        <dl className="fv31-wiki-fields">
          {fields.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {d?.descriptionVi && (
        <section>
          <h3>Mô tả</h3>
          <p>{d.descriptionVi}</p>
        </section>
      )}
      {!fields.length && !d?.descriptionVi && (
        <p className="fv2-muted">Thông tin bổ sung: —</p>
      )}
      {item.classHref && (
        <a href={item.classHref}>Xem kỹ năng và combo Class</a>
      )}
    </div>
  );
}

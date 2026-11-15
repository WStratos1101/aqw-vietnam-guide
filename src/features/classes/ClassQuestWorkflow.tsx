import { useState } from "react";
import workflows from "../../content/farm/class-workflows.generated.json";
import { FarmRouteFacts } from "../farm/FarmRouteFacts";
import type { FarmTask } from "../../types/farm-v2";

const routeNames: Record<string, string> = {
  traditional: "Chuỗi Quest truyền thống",
  "legendary-paladin": "Có Paladin",
  "silver-paladin": "Có Silver Paladin",
  "weekly-regular": "Weekly thường",
  "weekly-ultra": "Weekly dùng Ultra Gramiel",
  "quest-unlock": "Quest mở Shop",
};

export function ClassQuestWorkflow({ classId }: { classId: string }) {
  const [selected, setSelected] = useState("");
  const record = workflows.find(r => r.canonicalId === classId);
  if (!record) return null;
  const route = record.routes.find(r => r.routeId === selected) || record.routes[0];
  const shop = "shopUnlock" in route ? route.shopUnlock : null;
  return (
    <details className="class-quest-workflow">
      <summary>Chi tiết Quest và nguyên liệu đã đối chiếu Wiki</summary>
      <p>Một số nguồn nguyên liệu và điều kiện mở khu vực vẫn đang chờ xác minh.</p>
      {record.routes.length > 1 && (
        <div className="acquisition-method-tabs" role="group" aria-label="Chọn chuỗi Quest">
          {record.routes.map(option => (
            <button key={option.routeId} type="button" aria-pressed={route.routeId === option.routeId}
              onClick={() => setSelected(option.routeId)}>{routeNames[option.routeId] || option.routeId}</button>
          ))}
        </div>
      )}
      <FarmRouteFacts route={{ id: route.routeId, method: route.kind, regionId: null,
        steps: [], sources: [], farmTasks: route.tasks as unknown as FarmTask[] }} />
      {shop && <p>Hoàn thành <b>{shop.finalQuest}</b>, gặp {shop.npc} tại <code>{shop.mapJoin}</code>, mở{" "}
        <a href={shop.sourceUrl} target="_blank" rel="noreferrer">{shop.shop}</a> để mua {shop.purchase.name} với {shop.purchase.amount} {shop.purchase.currency}.</p>}
    </details>
  );
}

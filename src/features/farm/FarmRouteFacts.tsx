import { useState } from "react";
import materialSources from "../../content/farm/material-sources.generated.json";
import materialGuides from "../../../content-sources/farm/material-guides.json";
import type { FarmTask, FarmV2RouteData } from "../../types/farm-v2";

const nestedGuides = { ...materialGuides, ...materialSources } as unknown as Record<string, { method: string; tasks: FarmTask[] }>;

function verifiedJoinCommand(value?: string | null) {
  const match = value?.match(/^\s*\/?join\s+([a-z0-9_-]+)\s*$/i);
  return match ? `/join ${match[1]}` : null;
}

function JoinLine({ value }: { value?: string | null }) {
  const command = verifiedJoinCommand(value);
  return command ? <div className="fv32-join"><code>{command}</code></div> : null;
}

export function FarmActions({ text }: { text: string }) {
  const lines = text
    .split(/\n+|;\s+|(?<=[.!?])\s+(?=[A-ZĐÀÁÂĂÊÔƠƯ])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    <ul className="fv32-actions">
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}
function InsigniaSources({ route }: { route: FarmV2RouteData }) {
  if (!route.insigniaSources?.length) return null;
  return (
    <section className="fv32-insignia-sources" aria-label="Ultra Boss và Insignia">
      <h4>Ultra Boss / Insignia</h4>
      {route.insigniaSources.map((source, index) => (
        <div key={`${source.materialId}-${source.scope}-${index}`}>
          <p><b>{source.name} ×{source.quantity.toLocaleString("vi-VN")}</b>
            {source.scope !== "direct" && " · Nguyên liệu trung gian"}</p>
          {source.status === "PENDING_SOURCE" ? <p>Quest, NPC và map: chưa xác minh.</p> : (
            <>
              <p>Quest: <b>{source.quest}</b> · NPC: {source.npc}</p>
              {source.bossId && <p>Đánh <a href={`/ultra-boss/${source.bossId}`}>{source.bossName}</a></p>}
              <JoinLine value={source.map} />
              <p>Nhận {source.rewardQuantity} Insignia / {source.repeatability === "weekly" ? "tuần" : "ngày"} từ quest.</p>
              {source.sourcePage && <a href={source.sourcePage} target="_blank" rel="noreferrer">Quest trên AQW Wiki</a>}
            </>
          )}
        </div>
      ))}
    </section>
  );
}
export function FarmRouteFacts({
  route,
  taskId,
  visitedMaterials = [],
}: {
  route: FarmV2RouteData;
  taskId?: string;
  visitedMaterials?: string[];
}) {
  const [openedMaterials, setOpenedMaterials] = useState<string[]>([]);
  const tasks = (route.farmTasks || []).filter(
    (t) => !taskId || t.id === taskId,
  );
  if (!tasks.length)
    return (
      <div className="fv32-facts">
        <dl className="fv31-wiki-fields">
          <div>
            <dt>Phương thức</dt>
            <dd>{route.method}</dd>
          </div>
          <div>
            <dt>Nơi nhận</dt>
            <dd>
              {route.location || "Chưa xác minh"}
              <JoinLine value={route.mapCommand} />
            </dd>
          </div>
          {route.questReward && (
            <div>
              <dt>Quest</dt>
              <dd>{route.questReward}</dd>
            </div>
          )}
          {route.npc && <div><dt>NPC</dt><dd>{route.npc}</dd></div>}
          {route.dropSource && <div><dt>Quái drop / nguồn nhận</dt><dd>{route.dropSource}</dd></div>}
          {route.purchase && <div><dt>Giá mua</dt><dd>{route.purchase.amount.toLocaleString("vi-VN")} {route.purchase.currency}</dd></div>}
          {!!route.questAlternatives?.length && <div><dt>Các quest có thể nhận</dt><dd><ul>{route.questAlternatives.map((option, index) => <li key={index}>{option.sources[0] ? <a href={option.sources[0]} target="_blank" rel="noreferrer">{option.quest}</a> : option.quest}{option.npc && ` · ${option.npc}`}</li>)}</ul></dd></div>}
        </dl>
        {route.description && <FarmActions text={route.description} />}
        <InsigniaSources route={route} />
      </div>
    );
  return (
    <div className="fv32-facts">
      {tasks.map((task) => {
        const maps = [
          ...new Set(
            task.rows.map((row) => row.map || "Map chưa xác minh"),
          ),
        ];
        return (
          <section key={task.id}>
            <h4>{task.quest || task.title}</h4>
            {(task.preconditions || task.requirements || []).length > 0 && (
              <div className="fv32-quest-conditions">
                <b>Điều kiện nhận Quest</b>
                <ul>
                  {(task.preconditions || task.requirements).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {task.npc && (
              <p><b>Nơi nhận:</b> {task.npc}</p>
            )}
            {task.repeatability && (
              <p><b>Giới hạn / nhịp lặp:</b> {task.repeatability}</p>
            )}
            {task.quantityScope === "perTurn" && (
              <p>Nguyên liệu cho mỗi lần trả Quest.
                {task.numberOfRuns && task.totalRequired
                  ? ` Nhánh chỉ làm Quest: ${task.numberOfRuns} lần → ${task.totalRequired} ${task.reward?.split(" ×")[0] || "phần thưởng"}.`
                  : ""}
              </p>
            )}
            <JoinLine value={task.map} />
            {task.preconditions && task.requirements.length > 0 && (
              <FarmActions text={task.requirements.join("\n")} />
            )}
            {task.bossId && <p>Đánh <a href={`/ultra-boss/${task.bossId}`}>{task.bossName}</a></p>}
            {maps.map((map) => (
              <div key={map}>
                <h5>{map}</h5>
                <div
                  className="fv32-table-scroll"
                  role="region"
                  aria-label={`Nguyên liệu tại ${map}`}
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Tên nguyên liệu</th>
                        <th>Số lượng</th>
                        <th>Quái drop / nguồn nhận</th>
                        <th>Map</th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.rows
                        .filter(
                          (row) =>
                            (row.map || "Map chưa xác minh") ===
                            map,
                        )
                        .map((row, i) => {
                          const token = task.id + ":" + (row.itemId || row.name);
                          const nested = row.itemId && !visitedMaterials.includes(row.itemId) ? nestedGuides[row.itemId] : null;
                          return (
                          <tr key={i}>
                            <td>
                              <details onToggle={event => {
                                if (event.target !== event.currentTarget) return;
                                const open = event.currentTarget.open;
                                setOpenedMaterials(current => open ? [...new Set([...current, token])] : current.filter(value => value !== token));
                              }}>
                                <summary>{row.name}</summary>
                                {row.requiredQuest && <p>Nhận Quest trước khi farm: {row.requiredQuest}.</p>}
                                {row.maxStack != null && <p>Stack tối đa: {row.maxStack.toLocaleString("vi-VN")}.</p>}
                                {row.sourceDetails?.length ? row.sourceDetails.map((source, n) => (
                                  <div key={n}>
                                    <p>{source.monster || source.kind}</p>
                                    <JoinLine value={source.mapJoin} />
                                    {source.requiredQuest && source.requiredQuest !== row.requiredQuest && <p>Cần nhận Quest {source.requiredQuest}.</p>}
                                    {!!source.unlockRequirements?.length && <ul>{source.unlockRequirements.map((line, j) => <li key={j}>{line}</li>)}</ul>}
                                    {source.evidence?.map((e, j) => <p key={j}><a href={e.url} target="_blank" rel="noreferrer">{j === 0 ? "Nguồn nguyên liệu" : "Nguồn map"} trên Wiki</a></p>)}
                                  </div>
                                )) : <p>{row.monster || row.sourceName || nested?.method || "Nguồn farm chưa xác minh."}</p>}
                                {row.source && <a href={row.source} target="_blank" rel="noreferrer">Yêu cầu trên AQW Wiki</a>}
                                {nested && row.itemId && openedMaterials.includes(token) && (
                                  <FarmRouteFacts route={{ id: row.itemId, method: nested.method, regionId: null, steps: [], sources: [], farmTasks: nested.tasks }}
                                    visitedMaterials={[...visitedMaterials, row.itemId]} />
                                )}
                              </details>
                            </td>
                            <td>{row.quantity?.toLocaleString("vi-VN") ?? "—"}
                              {row.quantityTotal != null && <small> · Tổng {row.quantityTotal.toLocaleString("vi-VN")}</small>}
                            </td>
                            <td>
                              {row.monster || row.sourceName || "Chưa xác minh"}
                            </td>
                            <td>{row.map || "Chưa xác minh"}</td>
                          </tr>
                        ); })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {task.reward && (
              <p>
                <b>Nhận:</b> {task.reward}
              </p>
            )}
            {!!task.rewardChoices?.length && (
              <details><summary>Chọn đúng một phần thưởng ({task.rewardChoices.length} lựa chọn)</summary>
                <ul>{task.rewardChoices.map((reward, n) => <li key={n}>{reward.name} ×{reward.quantity}</li>)}</ul>
              </details>
            )}
            {!!task.randomChoiceRewards?.length && (
              <p>Nhận ngẫu nhiên một trong: {task.randomChoiceRewards.map(r => `${r.name} ×${r.quantity}`).join("; ")}.</p>
            )}
            {!!task.randomRewards?.length && (
              <p>Có thể nhận thêm ngẫu nhiên: {task.randomRewards.map(r => `${r.name} ×${r.quantity}`).join("; ")}.</p>
            )}
            {task.destination && (
              <p>
                <b>Nhận trang bị:</b> {task.destination.npc ? `Gặp ${task.destination.npc} tại ` : "Mở "}
                {task.destination.map}, mở {task.destination.shop} để lấy{" "}
                {task.destination.item}.
              </p>
            )}
          </section>
        );
      })}
      {!taskId && <InsigniaSources route={route} />}
    </div>
  );
}

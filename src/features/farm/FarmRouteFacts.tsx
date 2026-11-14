import type { FarmV2RouteData } from "../../types/farm-v2";

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
}: {
  route: FarmV2RouteData;
  taskId?: string;
}) {
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
            {(task.npc || route.location) && (
              <p><b>Nơi nhận:</b> {task.npc || route.location}</p>
            )}
            <JoinLine
              value={
                verifiedJoinCommand(task.map) ||
                verifiedJoinCommand(route.mapCommand)
              }
            />
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
                        .map((row, i) => (
                          <tr key={i}>
                            <td>{row.name}</td>
                            <td>{row.quantity ?? "—"}</td>
                            <td>
                              {row.monster || row.sourceName || "Chưa xác minh"}
                            </td>
                            <td>{row.map || "Chưa xác minh"}</td>
                          </tr>
                        ))}
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
            {task.destination && (
              <p>
                <b>Nhận trang bị:</b> Gặp {task.destination.npc} tại{" "}
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

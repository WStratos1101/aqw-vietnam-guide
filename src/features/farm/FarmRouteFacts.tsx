import type { FarmV2RouteData } from "../../types/farm-v2";
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
            <dd>{route.location || "Chưa xác minh"}</dd>
          </div>
          {route.mapCommand && (
            <div>
              <dt>Map</dt>
              <dd>
                <code>{route.mapCommand}</code>
              </dd>
            </div>
          )}
          {route.questReward && (
            <div>
              <dt>Quest</dt>
              <dd>{route.questReward}</dd>
            </div>
          )}
        </dl>
        {route.description && <FarmActions text={route.description} />}
      </div>
    );
  return (
    <div className="fv32-facts">
      {tasks.map((task) => {
        const maps = [
          ...new Set(
            task.rows.map((row) => row.map || task.map || "Map chưa xác minh"),
          ),
        ];
        return (
          <section key={task.id}>
            <h4>{task.quest || task.title}</h4>
            {task.requirements.length > 0 && (
              <ul>
                {task.requirements.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
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
                            (row.map || task.map || "Map chưa xác minh") ===
                            map,
                        )
                        .map((row, i) => (
                          <tr key={i}>
                            <td>{row.name}</td>
                            <td>{row.quantity ?? "—"}</td>
                            <td>
                              {row.monster || row.sourceName || "Chưa xác minh"}
                            </td>
                            <td>{row.map || task.map || "Chưa xác minh"}</td>
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
    </div>
  );
}

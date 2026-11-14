import { useEffect, useId, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { guidePaths, conciseFarmText } from "../../lib/farm-details.mjs";
import type {
  FarmAcquisitionBrief,
  FarmGuidePath,
  FarmV2RouteData,
} from "../../types/farm-v2";
function Stepper({
  path,
  scope,
  materials,
}: {
  path: FarmGuidePath;
  scope: string;
  materials?: ReactNode;
}) {
  const [index, setIndex] = useState(0),
    [done, setDone] = useState<string[]>([]),
    [error, setError] = useState("");
  const multiple = path.steps.length > 1;
  const id = useId(),
    step = path.steps[index];
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("aqw:farm-guide:" + scope) || "[]",
      );
      setDone(
        Array.isArray(saved)
          ? saved.filter(
              (v: unknown) =>
                typeof v === "string" && path.steps.some((s) => s.id === v),
            )
          : [],
      );
    } catch {
      setDone([]);
    }
  }, [scope, path]);
  const move = (n: number) =>
    setIndex(Math.max(0, Math.min(path.steps.length - 1, n)));
  return (
    <section className="fv31-stepper" aria-label="Hướng dẫn theo bước">
      {multiple && (
        <div
          className="fv31-step-numbers"
          role="tablist"
          aria-label="Các bước Farm"
          onKeyDown={(e) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
              return;
            e.preventDefault();
            const n =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? path.steps.length - 1
                  : (index +
                      (e.key === "ArrowRight" ? 1 : -1) +
                      path.steps.length) %
                    path.steps.length;
            move(n);
            e.currentTarget
              .querySelectorAll<HTMLButtonElement>('[role="tab"]')
              [n]?.focus();
          }}
        >
          {path.steps.map((s, n) => (
            <button
              type="button"
              role="tab"
              key={s.id}
              id={`${id}-step-${n}`}
              aria-controls={id + "-content"}
              aria-selected={index === n}
              tabIndex={index === n ? 0 : -1}
              className={
                (index === n ? "active " : "") +
                (done.includes(s.id) ? "completed" : "")
              }
              onClick={() => move(n)}
              aria-label={`Bước ${n + 1}${done.includes(s.id) ? " · Đã hoàn thành" : ""}`}
            >
              {done.includes(s.id) ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                n + 1
              )}
            </button>
          ))}
        </div>
      )}
      <div
        className="fv31-step-content"
        role={multiple ? "tabpanel" : undefined}
        id={id + "-content"}
        aria-labelledby={multiple ? `${id}-step-${index}` : undefined}
        tabIndex={0}
      >
        {multiple && (
          <small>
            Bước {index + 1} / {path.steps.length}
          </small>
        )}
        {!/^Bước \d+$/.test(step.title) && <h3>{step.title}</h3>}
        <p>{conciseFarmText(step.text)}</p>
        {materials && index === path.steps.length - 1 && (
          <details className="fv31-step-materials">
            <summary>Nguyên liệu tuyến nhận</summary>
            {materials}
          </details>
        )}
        <label className="fv31-step-complete">
          <input
            type="checkbox"
            checked={done.includes(step.id)}
            onChange={() => {
              const next = done.includes(step.id)
                ? done.filter((s) => s !== step.id)
                : [...done, step.id];
              setDone(next);
              try {
                localStorage.setItem(
                  "aqw:farm-guide:" + scope,
                  JSON.stringify(next),
                );
                setError("");
              } catch {
                setError("Không lưu được tiến độ.");
              }
            }}
          />
          Đã hoàn thành bước này
        </label>
        {error && <p role="status">{error}</p>}
      </div>
      {multiple && (
        <div className="fv31-step-actions">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => move(index - 1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Trước
          </button>
          <button
            type="button"
            disabled={index === path.steps.length - 1}
            onClick={() => move(index + 1)}
          >
            Tiếp
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
export function FarmGuide({
  route,
  itemId,
  materials,
  brief,
}: {
  route: FarmV2RouteData;
  itemId: string;
  materials?: ReactNode;
  brief?: FarmAcquisitionBrief;
}) {
  const paths = guidePaths(route);
  const [selected, setSelected] = useState(paths[0]?.id || "");
  const active = paths.find((p) => p.id === selected) || paths[0];
  if (!active)
    return (
      <p className="fv2-muted">
        {brief?.text || "Chưa có hướng dẫn đã xác minh."}
      </p>
    );
  return (
    <div className="fv2-guide">
      {active.coverage === "acquisition_only" && (
        <small className="fv2-muted">Cách nhận ngắn</small>
      )}
      {active.coverage === "source_notes" && (
        <small className="fv2-muted">Ghi chú tuyến nhận</small>
      )}
      {paths.length > 1 && (
        <div className="fv2-route-chips" aria-label="Chọn hướng dẫn">
          {paths.map((p) => (
            <button
              type="button"
              key={p.id}
              aria-pressed={p.id === active.id}
              className={p.id === active.id ? "active" : ""}
              onClick={() => setSelected(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <Stepper
        key={itemId + ":" + route.id + ":" + active.id}
        scope={itemId + ":" + route.id + ":" + active.id}
        path={active}
        materials={materials}
      />
    </div>
  );
}

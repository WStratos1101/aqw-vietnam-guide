import { useState } from "react";
import { Bookmark, Check, Copy } from "lucide-react";
import { readStored, writeStored } from "../lib/storage";
import type { FarmingGuide } from "../types/content";
export function BookmarkButton({ id }: { id: string }) {
  const [saved, setSaved] = useState(() =>
    readStored<string[]>("aqw:bookmarks", []).includes(id),
  );
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="button secondary"
        aria-pressed={saved}
        onClick={() => {
          const ids = readStored<string[]>("aqw:bookmarks", []);
          const next = saved ? ids.filter((v) => v !== id) : [...ids, id];
          if (writeStored("aqw:bookmarks", next)) {
            setSaved(!saved);
            setError("");
          } else
            setError(
              "Trình duyệt không cho lưu. Hãy cho phép bộ nhớ trang rồi thử lại.",
            );
        }}
      >
        <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        {saved ? "Đã lưu bài" : "Lưu bài viết"}
      </button>
      <span role="status">{error}</span>
    </>
  );
}
export function CopyCommand({ command }: { command: string }) {
  const [message, setMessage] = useState("");
  return (
    <div className="command">
      <code>{command}</code>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setMessage("Đã sao chép");
          } catch {
            setMessage(
              "Không thể sao chép. Hãy chọn lệnh và sao chép thủ công.",
            );
          }
        }}
      >
        {message === "Đã sao chép" ? <Check size={18} /> : <Copy size={18} />}{" "}
        Sao chép
      </button>
      <span className="copy-status" role="status">
        {message}
      </span>
    </div>
  );
}
export function Checklist({ guide }: { guide: FarmingGuide }) {
  const key = `aqw:progress:${guide.slug}`;
  const [done, setDone] = useState(() =>
    readStored<string[]>(key, []).filter((id) =>
      guide.checklist.some((s) => s.id === id),
    ),
  );
  const [message, setMessage] = useState("");
  function save(next: string[]) {
    setDone(next);
    setMessage(
      writeStored(key, next)
        ? "Đã lưu tiến độ trên thiết bị này."
        : "Không lưu được vào trình duyệt. Tiến độ hiện chỉ được giữ trong trang đang mở.",
    );
  }
  return (
    <section className="checklist" aria-labelledby="progress-title" data-ui>
      <div className="checklist-heading">
        <h2 id="progress-title">Tiến độ của bạn</h2>
        <span>
          {done.length}/{guide.checklist.length} hoàn thành
        </span>
      </div>
      <progress
        value={done.length}
        max={guide.checklist.length}
        aria-label="Tiến độ farm"
      />
      {guide.checklist.map((step, i) => (
        <label
          className={`check-step ${done.includes(step.id) ? "is-done" : ""}`}
          key={step.id}
        >
          <input
            type="checkbox"
            checked={done.includes(step.id)}
            onChange={() =>
              save(
                done.includes(step.id)
                  ? done.filter((id) => id !== step.id)
                  : [...done, step.id],
              )
            }
          />
          <span>
            <strong>{step.title}</strong>
            <span>{step.detail}</span>
            {step.requires && (
              <small>
                Điều kiện: hoàn thành{" "}
                {guide.checklist.find((s) => s.id === step.requires)?.title}
              </small>
            )}
            <small>Bước {i + 1}</small>
          </span>
        </label>
      ))}
      <button className="text-button" onClick={() => save([])}>
        Đặt lại checklist
      </button>
      <p role="status">{message}</p>
    </section>
  );
}

export function SectionProgress({
  pageId,
  sectionId,
}: {
  pageId: string;
  sectionId: string;
}) {
  const key = `aqw:guide-steps:${pageId}`;
  const [done, setDone] = useState(() =>
    readStored<string[]>(key, []).includes(sectionId),
  );
  const [error, setError] = useState("");
  return (
    <div className="section-progress">
      <label>
        <input
          type="checkbox"
          checked={done}
          onChange={() => {
            const stored = readStored<string[]>(key, []);
            const next = done
              ? stored.filter((id) => id !== sectionId)
              : [...stored, sectionId];
            setDone(!done);
            setError(
              writeStored(key, next)
                ? ""
                : "Chưa lưu được vào bộ nhớ trình duyệt.",
            );
          }}
        />
        Đã hoàn thành bước này
      </label>
      {error && <p role="status">{error}</p>}
    </div>
  );
}

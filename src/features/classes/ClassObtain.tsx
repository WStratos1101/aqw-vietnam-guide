import { AcquisitionMaterials } from "./AcquisitionMaterials";
import { useEffect, useState } from "react";
import type { AqwClass, ClassBody } from "../../types/classes";
import { readStored, writeStored } from "../../lib/storage";
import { classProgress, classProgressKey } from "../../lib/classes";
import { CopyCommand } from "../Interactions";
import { RichContent } from "../RichContent";
export function ClassObtain({
  profile,
  body,
  embedded = false,
  progressScope = "",
}: {
  profile: AqwClass;
  body: ClassBody;
  embedded?: boolean;
  progressScope?: string;
}) {
  const key =
    classProgressKey(profile.id) + (progressScope ? ":" + progressScope : "");
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => {
      setDone(classProgress(readStored<string[]>(key, []), body.obtainSteps));
      setLoaded(true);
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [key, body]);
  return (
    <section
      className="class-section"
      id={embedded ? undefined : "cach-lay"}
      aria-label={embedded ? "Quest Progression Timeline" : undefined}
      aria-labelledby={embedded ? undefined : "obtain-title"}
    >
      {!embedded && (
        <div className="class-section-title">
          <h2 id="obtain-title" tabIndex={-1}>
            Hướng dẫn lấy Class
          </h2>
          <p>{profile.acquisitionSummary}</p>
        </div>
      )}
      {body.obtainSteps.length ? (
        <>
          <div className="class-progress-head">
            <span aria-live="polite">
              {loaded
                ? `${done.length} / ${body.obtainSteps.length} bước đã ghi nhận`
                : "Đang đọc tiến độ…"}
            </span>
            <button
              onClick={() => {
                setDone([]);
                setError(
                  writeStored(key, [])
                    ? ""
                    : "Không lưu được thay đổi. Kiểm tra quyền bộ nhớ trình duyệt.",
                );
              }}
            >
              Đặt lại tiến độ
            </button>
          </div>
          <progress
            aria-label="Tiến độ lấy Class"
            value={done.length}
            max={body.obtainSteps.length}
          />
          <p className="class-progress-note">
            Checklist là ghi chú mốc cá nhân, không xác nhận tài khoản game.
            Quest có giới hạn ngày hoặc cần farm lặp vẫn tuân theo điều kiện
            trong game.
          </p>
          {body.obtainOverview.length > 0 && (
            <details className="class-preparation class-disclosure">
              <summary>Điều kiện mở khóa và các phương án khác</summary>
              <div className="class-disclosure-content">
                <RichContent blocks={body.obtainOverview} />
              </div>
            </details>
          )}
          <ol className="class-obtain-steps">
            {body.obtainSteps.map((s) => (
              <li key={s.id} className={done.includes(s.id) ? "completed" : ""}>
                <div className="class-step-head">
                  <span className="class-step-number">{s.stepNumber}</span>
                  <h3>{s.title}</h3>
                  <label>
                    <input
                      type="checkbox"
                      disabled={!loaded}
                      checked={done.includes(s.id)}
                      aria-label={`Hoàn thành ${s.title}`}
                      onChange={() => {
                        const next = done.includes(s.id)
                          ? done.filter((id) => id !== s.id)
                          : [...done, s.id];
                        setDone(next);
                        setError(
                          writeStored(key, next)
                            ? ""
                            : "Không lưu được tiến độ; hiện chỉ giữ trong phiên này.",
                        );
                      }}
                    />
                    <span>Đã ghi nhận</span>
                  </label>
                </div>
                {s.materialTree && (
                  <AcquisitionMaterials
                    tree={s.materialTree}
                    scope={
                      profile.id +
                      ":" +
                      (progressScope || "legacy") +
                      ":" +
                      s.id
                    }
                    title="Quest Materials"
                  />
                )}
                <div className="class-step-body">
                  <details>
                    <summary>Điều kiện & vật phẩm</summary>
                    <p>{s.description}</p>
                    <dl>
                      <div>
                        <dt>Nơi nhận / NPC</dt>
                        <dd>
                          {s.location ||
                            [s.npc, s.map].filter(Boolean).join(" • ") ||
                            "Xem chi tiết bên dưới"}
                        </dd>
                      </div>
                      <div>
                        <dt>Kết quả</dt>
                        <dd>{s.reward}</dd>
                      </div>
                      {s.repeatable && (
                        <div>
                          <dt>Tính chất</dt>
                          <dd>Cần thực hiện lặp để gom đủ yêu cầu.</dd>
                        </div>
                      )}
                    </dl>
                    {s.requirement.length > 0 && (
                      <ul>
                        {s.requirement.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                    {!s.materialTree && !!s.materials?.length && (
                      <div className="class-material-list">
                        <h4>Materials</h4>
                        <ul>
                          {s.materials.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {s.joinCommand && <CopyCommand command={s.joinCommand} />}{" "}
                    {s.details?.length ? (
                      <details className="class-disclosure">
                        <summary>Vật phẩm, map và yêu cầu chi tiết</summary>
                        <div className="class-disclosure-content">
                          <RichContent blocks={s.details} />
                        </div>
                      </details>
                    ) : null}
                  </details>
                </div>
              </li>
            ))}
          </ol>
          <p role="status" className="class-storage-error">
            {error}
          </p>
        </>
      ) : (
        <div className="class-empty">
          <p>
            Chưa có lộ trình lấy Class đủ dữ liệu để tạo checklist. Phần này
            đang cập nhật.
          </p>
        </div>
      )}
    </section>
  );
}

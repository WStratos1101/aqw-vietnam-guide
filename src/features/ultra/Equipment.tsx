import { detailFor, ProgressionJournal, hasProgressionJournal } from "./BossTactics";
import {RPGEquipmentSelector} from "./RPGEquipmentSelector";
import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type {
  UltraBoss,
  EquipmentRoute,
  QuestStep,
  UltraGuideContent,
} from "../../types/ultra";
import { readStored, writeStored } from "../../lib/storage";
import { completedMilestones, progressKey } from "../../lib/ultra-progress";
import {MaterialTree} from './MaterialTree';
import {EquipmentProgressionPath} from './EquipmentMetadata';
const repeatLabels = {
  once: "Mốc progression",
  daily: "Nhật ký ngày",
  weekly: "Nhật ký tuần",
  repeatable: "Lặp lại",
};
function QuestRow({
  quest,
  index,
  bossId,
  routeId,
  checked,
  onToggle,
  dependencyNames,
}: {
  quest: QuestStep;
  index: number;
  bossId: string;
  routeId: string;
  checked: boolean;
  onToggle: () => void;
  dependencyNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`ultra-quest ${checked ? "is-done" : ""}`} role="row">
      <div role="cell" data-label="STT" className="ultra-quest-number">
        {index + 1}
      </div>
      <div role="cell" data-label="Quest">
        <button
          className="ultra-quest-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {quest.name}
          <ChevronDown size={16} className={open ? "rotated" : ""} />
        </button>
        <small>{repeatLabels[quest.repeatability]}</small>
        <div id={id} hidden={!open} className="ultra-quest-detail">
          <p>
            {quest.dependencies.length
              ? `Bước trước: ${dependencyNames.join(", ")}`
              : "Bước đầu của tuyến đang theo dõi."}
          </p>
          {quest.requirements.length>0&&<div><strong>Điều kiện</strong>{quest.requirements.map(r=><p key={r}>{r}</p>)}</div>}
          {quest.materialTree?<MaterialTree tree={quest.materialTree} scope={quest.materialScope||routeId}/>:quest.items.length>0&&<div><strong>Nguyên liệu</strong><ul>{quest.items.map(r=><li key={r}>{r}</li>)}</ul></div>}
          <div><strong>Phần thưởng</strong><p>{quest.reward}</p></div>
          {quest.guide && <a href={quest.guide}>Đọc hướng dẫn liên quan</a>}
        </div>
      </div>
      <div role="cell" data-label="Trạng thái">
        <label className="ultra-quest-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            name={`${bossId}-${routeId}-${quest.id}`}
            aria-label={`Đánh dấu ${quest.name}`}
          />
          <span>{checked ? "Đã ghi nhận" : "Chưa ghi nhận"}</span>
        </label>
      </div>
    </div>
  );
}
function RouteQuests({
  bossId,
  route,
}: {
  bossId: string;
  route: EquipmentRoute;
}) {
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = () => {
      setDone(
        new Set(
          route.quests
            .filter((q) =>
              readStored<string[]>(
                progressKey(bossId, route.id, q),
                [],
              ).includes(q.id),
            )
            .map((q) => q.id),
        ),
      );
      setLoaded(true);
    };
    load();
    window.addEventListener("storage", load);
    const timer = window.setInterval(load, 60000);
    return () => {
      window.removeEventListener("storage", load);
      window.clearInterval(timer);
    };
  }, [bossId, route]);
  const progress = completedMilestones(route, done);
  return (
    <div className="ultra-route-quests ultra-tab-content" aria-live="polite">
      <div className="ultra-route-heading">
        <div>
          <h4>Quest & tiến độ</h4>
        </div>
        <span>
          {progress.total
            ? `Tiến độ: ${progress.done} / ${progress.total} mốc`
            : "Không có mốc cố định"}
        </span>
      </div>
      {route.quests.filter(q=>q.repeatability==='once').length>1&&<ol className="route-milestones" aria-label="Các mốc sở hữu">{route.quests.filter(q=>q.repeatability==='once').map(q=><li key={q.id} className={done.has(q.id)?'is-done':''}><span aria-hidden="true">{done.has(q.id)?'✓':'○'}</span>{q.reward}</li>)}</ol>}
      {!loaded && <p role="status">Đang đọc tiến độ…</p>}
      <div
        className="ultra-quest-table"
        role="table"
        aria-label={`Quest cho ${route.itemName}`}
      >
        <div role="row" className="ultra-quest-head">
          {[
            "STT",
            "Quest",
            "Trạng thái",
          ].map((t) => (
            <div role="columnheader" key={t}>
              {t}
            </div>
          ))}
        </div>
        {(expanded ? route.quests : route.quests.slice(0, 4)).map((q, i) => (
          <QuestRow
            key={q.id}
            quest={q}
            dependencyNames={q.dependencies.map(
              (id) =>
                route.quests.find((step) => step.id === id)?.name ||
                "Bước trước",
            )}
            index={i}
            bossId={bossId}
            routeId={route.id}
            checked={done.has(q.id)}
            onToggle={() => {
              const next = new Set(done);
              next.has(q.id) ? next.delete(q.id) : next.add(q.id);
              setDone(next);
              setError(
                writeStored(
                  progressKey(bossId, route.id, q),
                  next.has(q.id) ? [q.id] : [],
                )
                  ? ""
                  : "Bộ nhớ trình duyệt bị chặn; tiến độ hiện chỉ giữ trong phiên này.",
              );
            }}
          />
        ))}
      </div>
      {route.quests.length > 4 && (
        <button
          className="boss-progression-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Thu gọn" : `Xem đầy đủ (${route.quests.length} bước)`}
        </button>
      )}
      {error&&<p className="ultra-storage-message" role="status">
        {error}
      </p>}
    </div>
  );
}
export function Equipment({
  boss,
  guide,
  title='TRANG BỊ ENDGAME',
  headingId='equipment-title',
  allRoutes,
}: {
  boss: UltraBoss;
  guide?: UltraGuideContent | null;
  title?:string;
  headingId?:string;
  allRoutes?:EquipmentRoute[];
}) {
  return (
    <section
      className="ultra-section ultra-reveal"
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>{title}</h2>
      <EquipmentProgressionPath bossId={boss.id}/>
      <RPGEquipmentSelector routes={boss.equipmentRoutes} renderDetails={route=><RouteQuests key={`${boss.id}:${route.id}`} bossId={boss.id} route={route}/>}/>
      {guide?.progression.length && hasProgressionJournal(detailFor(boss.slug), allRoutes||boss.equipmentRoutes) ? (
        <details className="ultra-progression-reference">
          <summary>Chi tiết lộ trình và các món trang bị khác</summary>
          <ProgressionJournal detail={detailFor(boss.slug)} routes={allRoutes||boss.equipmentRoutes} />
        </details>
      ) : null}
    </section>
  );
}

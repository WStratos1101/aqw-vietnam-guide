import type { UltraBoss } from "../../types/ultra";
import { EnemyInspection } from "./EnemyInspection";

export function BossPanel({ boss }: { boss: UltraBoss }) {
  return (
    <section className="ultra-inspect ultra-reveal" data-ui="ultra-codex" aria-labelledby="inspect-title">
      <div className="ultra-panel-heading">
        <div><p className="ultra-eyebrow">ENEMY INSPECTION · {boss.name}</p><h2 id="inspect-title">Thông tin chiến đấu</h2></div>
      </div>
      <EnemyInspection slug={boss.slug} />
    </section>
  );
}

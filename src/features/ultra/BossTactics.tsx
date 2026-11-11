import {
  AlertTriangle,
  Heart,
  Crosshair,
  Shield,
  Clock,
  MapPin,
} from "lucide-react";
import data from "../../content/ultra/details.json";
import recovery from '../../content/ultra/recovery.json';
import type { BossDetailData } from "../../types/ultra";
import { RichContent } from "../RichContent";
import { Asset } from "./Asset";
import { TacticalBoard } from './TacticalBoard';
import { SpeakerTutorial } from './SpeakerTutorial';
import {WeaponStatStrip,MaterialRequirements,equipmentFor} from './EquipmentMetadata';
import {combatNotesFor,combatNoteText} from '../../lib/combat-inspection';
export const detailFor = (slug: string) =>
  ({...data,...recovery.details} as unknown as Record<string, BossDetailData>)[slug];
const icons: Record<string, typeof AlertTriangle> = {
  heal: Heart,
  taunt: Crosshair,
  target: Crosshair,
  shield: Shield,
  timer: Clock,
  zone: MapPin,
};
export function QuickNotes({ detail }: { detail: BossDetailData }) {
  const notes=combatNotesFor(detail.notes);
  if(!notes.length)return null;
  return (
    <div className="boss-quick-notes">
      {notes.map((n) => {
        const Icon = icons[n.icon] || AlertTriangle;
        return (
          <article key={n.id}>
            <Icon size={20} aria-hidden="true" />
            <p>{n.shortText}</p>
          </article>
        );
      })}
    </div>
  );
}
export function TauntPanel({ detail }: { detail: BossDetailData }) {
  if(!detail.tauntGuide.length&&!detail.tauntTables?.length)return null;
  const tauntEntries = (
    <div className="boss-taunt-entries">
      {detail.tauntGuide.map((t) => (
        <article key={t.id}>
          <Crosshair size={22} aria-hidden="true" />
          <h3>{t.target}</h3>
          <dl>
            <div><dt>Khi nào</dt><dd>{t.timing}</dd></div>
            <div><dt>Người đảm nhiệm</dt><dd>{t.role}</dd></div>
            <div><dt>Thực hiện</dt><dd>{t.instruction}</dd></div>
            {t.failureRisk&&<div><dt>Lưu ý</dt><dd>{combatNoteText(t.failureRisk)}</dd></div>}
          </dl>
        </article>
      ))}
    </div>
  );
  if (detail.tauntTables?.length) {
    return (
      <section className="ultra-section ultra-reveal boss-taunt boss-speaker-tactics">
        <p className="ultra-eyebrow">Team coordination / Community formation</p>
        <h2>Taunt</h2>
        <div className="speaker-tactical-layout">
          <div className="speaker-taunt-column">
            <SpeakerTutorial />
          </div>
          <TacticalBoard />
        </div>
      </section>
    );
  }
  return (
    <section className="ultra-section ultra-reveal boss-taunt">
      <p className="ultra-eyebrow">Phân công chiến thuật</p>
      <h2>Taunt</h2>
      <p>
        Phân công theo đúng đội hình; các ví dụ dưới đây không phải vai trò bắt
        buộc cho mọi Class.
      </p>
      {tauntEntries}
    </section>
  );
}
const canonicalEquipmentKey = (id: string | undefined, name: string) =>
  equipmentFor(name)?.id || (id || name).normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/g, " ").trim();

function additionalItems(detail: BossDetailData, routes: import("../../types/ultra").EquipmentRoute[]) {
  const routeIds = new Set(routes.map((route) => canonicalEquipmentKey(route.canonicalId, route.itemName)));
  return detail.additionalEquipment.filter((item) =>
    recovery.legacyEquipmentGroups.includes(item.canonicalId||'')?false:item.canonicalItemIds?.length
      ? !item.canonicalItemIds.every(id=>routeIds.has(id))
      : !routeIds.has(canonicalEquipmentKey(item.canonicalId, item.name)),
  );
}
export function hasProgressionJournal(detail: BossDetailData, routes: import("../../types/ultra").EquipmentRoute[]) {
  return detail.progressionTimelines.length > 0 || additionalItems(detail, routes).length > 0;
}
export function ProgressionJournal({ detail, routes = [] }: { detail: BossDetailData; routes?: import("../../types/ultra").EquipmentRoute[] }) {
  const additionalEquipment = additionalItems(detail, routes);
  if (!hasProgressionJournal(detail, routes)) return null;
  return (
    <div className="boss-progression-journal">
      {additionalEquipment.length > 0 && (
        <section>
          <h3>Trang bị liên quan</h3>
          <div className="boss-additional-items">
            {additionalEquipment.map((item) => (
              <article key={item.id}>
                <Asset
                  id={item.image || `pending-${item.id}`}
                  label={item.name}
                />
                <h4>{item.name}</h4>
                <WeaponStatStrip name={item.name}/>
                <MaterialRequirements name={item.name}/>
              </article>
            ))}
          </div>
        </section>
      )}
      {detail.progressionTimelines.map((t) => (
        <details className="boss-route-timeline" id={t.id} key={t.id}>
          <summary>{t.title}</summary>
          {!routes.some(r=>r.itemName==='Exalted Apotheosis')&&<p>{t.dependencyNote}</p>}
          {!!t.notes?.length && (
            <details>
              <summary>Lưu ý lộ trình</summary>
              <RichContent blocks={t.notes} />
            </details>
          )}
          <ol>
            {t.steps.map((s, i) => (
              <li key={s.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{s.title}</h4>
                  <details>
                    <summary>Điều kiện · Quest / Map · Mốc mở khóa</summary>
                    <RichContent blocks={s.blocks} />
                  </details>
                </div>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );
}

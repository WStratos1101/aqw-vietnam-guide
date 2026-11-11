import { useId, useState } from "react";
import {
  Coins,
  ScrollText,
  Anvil,
  MapPin,
  ShieldCheck,
  Clock3,
  ExternalLink,
  Package,
} from "lucide-react";
import type { AqwClass, ClassBody } from "../../types/classes";
import type { ClassAcquisitionMethod } from "../../types/class-acquisition";
import { ClassObtain } from "./ClassObtain";
import { AcquisitionMaterials } from "./AcquisitionMaterials";
import { presentedCalendarMethods, acquisitionTabLabel } from "../../lib/calendar-acquisition-v020";
import "../../styles/classes/acquisition-v12-4.css";
const labels = {
  shop: "SHOP",
  quest: "QUEST",
  merge: "MERGE",
  drop: "DROP",
  other: "KHÁC",
};
const icons = {
  shop: Coins,
  quest: ScrollText,
  merge: Anvil,
  drop: Package,
  other: ScrollText,
};
function Requirements({ method }: { method: ClassAcquisitionMethod }) {
  return (
    <>
      <dl className="acquisition-meta">
        {method.levelRequirement != null && (
          <div>
            <dt>Level Requirement</dt>
            <dd>{method.levelRequirement}</dd>
          </div>
        )}
        {method.baseLevel != null && (
          <div>
            <dt>Base Level của item</dt>
            <dd>{method.baseLevel}</dd>
          </div>
        )}
        {method.membershipRequirement === true && (
          <div>
            <dt>Membership</dt>
            <dd>
              <ShieldCheck size={15} />
              Yêu cầu Member
            </dd>
          </div>
        )}
      </dl>
      {method.prerequisites.length > 0 && (
        <div className="acquisition-prerequisites">
          <h4>Điều kiện mở khóa</h4>
          <ul>
            {method.prerequisites.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
function MethodPanel({
  method,
  profile,
  body,
}: {
  method: ClassAcquisitionMethod;
  profile: AqwClass;
  body: ClassBody;
}) {
  const Icon = icons[method.type];
  const availability =
    method.availability === "legacy"
      ? "Legacy · Không hiển thị như phương án đang mở"
      : method.availability === "seasonal"
        ? "Seasonal · Kiểm tra thời gian event"
        : method.availability === "limited"
          ? "Yêu cầu quyền sở hữu từ đợt phát hành cũ"
          : method.availability === "unknown"
            ? "Availability chưa xác minh"
            : "Khả dụng";
  const quest = method.quest;
  const code = method.acquisitionKind === "calendar_code";
  return (
    <article
      className="class-acquisition-method"
      data-acquisition-type={method.type}
      data-method-id={method.id}
    >
      <header className="acquisition-heading">
        <Icon size={22} />
        <div>
          <h3>{method.variantName}</h3>
          <p
            className={
              "acquisition-availability " +
              (method.isAvailable === false ? "is-legacy" : "")
            }
          >
            <Clock3 size={14} />
            {availability}
          </p>
        </div>
      </header>
      {method.shop && (
        <section className="acquisition-shop-card" aria-label="Shop Purchase">
          <div
            className="acquisition-price"
            data-currency={method.shop.price.currency}
          >
            <Coins size={25} aria-label="Biểu tượng tiền tệ minh họa" />
            <strong>
              {code
                ? method.shop.price.amount.toLocaleString("en-US")
                : method.acquisitionKind === "free"
                  ? "Free"
                  : method.shop.price.amount.toLocaleString("en-US")}
            </strong>
            {method.acquisitionKind !== "free" && (
              <span>
                {method.shop.price.currency === "AC"
                  ? "ACs"
                  : method.shop.price.currency}
              </span>
            )}
          </div>
          <h4>{method.shop.shopName}</h4>
          {method.shop.npc && <p>NPC · {method.shop.npc}</p>}
          {method.shop.map && (
            <p>
              <MapPin size={15} />
              {method.shop.map}
            </p>
          )}
          <Requirements method={method} />
          {method.unlockSteps && !code && (
            <details className="acquisition-unlock-route">
              <summary>Quest / lộ trình mở khóa phương án này</summary>
              <ClassObtain
                profile={profile}
                body={{
                  ...body,
                  obtainSteps: method.unlockSteps,
                  obtainOverview: [],
                }}
                embedded
                progressScope={
                  method.unlockUseLegacyProgressKey ? "" : method.id
                }
              />
            </details>
          )}
        </section>
      )}
      {quest && (
        <section
          className="acquisition-quest-card"
          aria-label="Quest Acquisition"
        >
          <h4>
            <ScrollText size={18} />
            Hoàn thành Quest: {quest.questName} để nhận Class.
          </h4>
          <dl className="acquisition-meta">
            {quest.npc && (
              <div>
                <dt>NPC</dt>
                <dd>{quest.npc}</dd>
              </div>
            )}
            {quest.map && (
              <div>
                <dt>Map</dt>
                <dd>{quest.map}</dd>
              </div>
            )}
            <div>
              <dt>Quest Reward</dt>
              <dd>{quest.reward}</dd>
            </div>
          </dl>
          <Requirements method={method} />
        </section>
      )}
      {method.merge && (
        <section
          className="acquisition-merge-card"
          aria-label="Merge Requirements"
        >
          <h4>
            <Anvil size={18} />
            MERGE REQUIREMENTS
          </h4>
          <dl className="acquisition-meta">
            <div>
              <dt>Merge Shop</dt>
              <dd>{method.merge.mergeShop}</dd>
            </div>
            {method.merge.npc && (
              <div>
                <dt>NPC</dt>
                <dd>{method.merge.npc}</dd>
              </div>
            )}
            {method.merge.map && (
              <div>
                <dt>Location</dt>
                <dd>{method.merge.map}</dd>
              </div>
            )}
          </dl>
          <Requirements method={method} />
          {method.merge.materials ? (
            <AcquisitionMaterials
              tree={method.merge.materials}
              scope={profile.id + ":" + method.id + ":merge"}
              title="Required Materials"
            />
          ) : (
            <div className="acquisition-pending">
              <p>Nguyên liệu: Chưa xác minh.</p>
              {method.merge.rawMaterials.length > 0 && (
                <ul>
                  {method.merge.rawMaterials.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!!method.merge.dependencies?.length && (
            <details className="acquisition-merge-dependencies">
              <summary>Prerequisite Items & Progression</summary>
              <p>
                Các mục dưới chuẩn bị nguyên liệu cho công thức chính; không
                cộng nguyên liệu trung gian vào yêu cầu Merge cuối.
              </p>
              <ol>
                {method.merge.dependencies.map((d) => (
                  <li key={d.itemId}>
                    <h5>
                      <Package size={16} />
                      {d.itemName} <span>×{d.requiredQuantity}</span>
                    </h5>
                    {d.verificationStatus === "verified" ? (
                      <>
                        <p>
                          {d.type === "merge"
                            ? "Merge nguyên liệu trung gian"
                            : d.type === "quest"
                              ? `Quest: ${d.questName}`
                              : d.type === "drop"
                                ? "Drop theo trang item"
                                : "Shop nhận item"}
                        </p>
                        {!!d.locations?.length && (
                          <p>{d.locations.join(" / ")}</p>
                        )}
                        {d.materials && (
                          <AcquisitionMaterials
                            tree={d.materials}
                            scope={
                              profile.id +
                              ":" +
                              method.id +
                              ":dependency:" +
                              d.itemId
                            }
                            title="Intermediate Materials"
                          />
                        )}
                      </>
                    ) : (
                      <p>Nguyên liệu: Chưa xác minh.</p>
                    )}
                    <a href={d.source} target="_blank" rel="noreferrer">
                      Wiki nguyên liệu
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      )}
      {method.other && (
        <section className="acquisition-other-card">
          <h4>{method.other.label}</h4>
          <p>{method.other.description}</p>
          <Requirements method={method} />
        </section>
      )}
      {method.drop && (
        <section className="acquisition-drop-card">
          <h4>
            <Package size={18} />
            Drop
          </h4>
          <p>{method.drop.from}</p>
          <Requirements method={method} />
        </section>
      )}
      {method.notes.length > 0 && (
        <ul className="acquisition-notes">
          {method.notes.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
export function ClassAcquisitionPanel({
  profile,
  body,
}: {
  profile: AqwClass;
  body: ClassBody;
}) {
  const methods = presentedCalendarMethods(profile.id,
    body.acquisition?.methods.filter((m) => m.verificationStatus === "verified") || []
  );
  const [selectedId, setSelectedId] = useState<string>();
  const method =
    methods.find((m) => m.id === selectedId) ||
    methods.find((m) => m.isAvailable !== false) ||
    methods[0];
  const id = useId();
  return (
    <section
      className="class-section class-acquisition"
      data-calendar={profile.id.startsWith("calendar-") ? "true" : undefined}
      id="cach-lay"
      aria-labelledby="class-acquisition-title"
    >
      <div className="class-section-title">
        <h2 id="class-acquisition-title">Cách lấy Class</h2>
      </div>
      {method ? (
        <>
          <div
            className="acquisition-method-tabs"
            role="tablist"
            aria-label="Phương pháp sở hữu Class"
            onKeyDown={(e) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
                return;
              e.preventDefault();
              const at = methods.findIndex((m) => m.id === method.id),
                next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? methods.length - 1
                      : (at +
                          (e.key === "ArrowRight" ? 1 : -1) +
                          methods.length) %
                        methods.length;
              setSelectedId(methods[next].id);
              e.currentTarget
                .querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus();
            }}
          >
            {methods.map((m) => {
              const Icon = icons[m.type as ClassAcquisitionMethod["type"]];
              return (
                <button
                  type="button"
                  role="tab"
                  key={m.id}
                  id={`${id}-${m.id}`}
                  aria-controls={`${id}-panel`}
                  aria-selected={m.id === method.id}
                  tabIndex={m.id === method.id ? 0 : -1}
                  onClick={() => setSelectedId(m.id)}
                >
                  <Icon size={16} />
                  <span>
                    {acquisitionTabLabel(m)}
                    <small>
                      {m.variantName}
                      {m.isAvailable === false ? " · Legacy" : ""}
                    </small>
                  </span>

                </button>
              );
            })}
          </div>
          <div
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={`${id}-${method.id}`}
            tabIndex={0}
          >
            <MethodPanel
              key={method.id}
              method={method}
              profile={profile}
              body={body}
            />
          </div>
        </>
      ) : (
        <div className="acquisition-pending">
          <ScrollText size={22} />
          <p>Cách lấy Class: Chưa xác minh.</p>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState, useRef } from "react";
import {
  Swords,
  Shirt,
  Shield,
  Flag,
  Bird,
  Search,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import catalog from "../../content/farm/catalog.json";
import manifest from "../../content/farm/manifest.json";
import type { FarmItem, FarmRegion, FarmFact } from "../../types/farm";
import {
  farmTypes,
  farmableNow,
  farmRoutes,
  unknownFarmRegion,
  farmItemHref,
  filterFarm,
  farmRegionCounts,
} from "../../lib/farm-catalog.mjs";
import { Breadcrumb } from "../../components/Shell";
import { MaterialTree } from "../ultra/MaterialTree";
import "./farm.css";
const items = catalog.items as FarmItem[],
  regions = catalog.regions as FarmRegion[];
const availability: Record<string, string> = {
  available: "Có thể nhận",
  seasonal: "Seasonal",
  legacy: "Legacy",
  rare: "Rare",
  unknown: "Chưa xác minh thời điểm mở",
};
const typeLabel = (type: string) =>
  type === "all"
    ? "Tất cả"
    : farmTypes.find((t) => t.id === type)?.label || type;
const categoryIcons = {
  weapon: Swords,
  armor: Shirt,
  helm: Shield,
  cape: Flag,
  pet: Bird,
  class: BookOpen,
};
function CategoryIcon({ type }: { type: string }) {
  const Icon = categoryIcons[type as keyof typeof categoryIcons] || Shield;
  return <Icon size={16} aria-hidden="true" />;
}
function Art({ item, small = false }: { item: FarmItem; small?: boolean }) {
  const [failed, setFailed] = useState(false);
  const Icon = {
    weapon: Swords,
    armor: Shirt,
    helm: Shield,
    cape: Flag,
    pet: Bird,
    class: BookOpen,
  }[item.type];
  return item.image && !failed ? (
    <img
      src={item.image.path}
      alt={small ? "" : item.officialName}
      width={small ? 48 : 300}
      height={small ? 48 : 240}
      loading={small ? "lazy" : "eager"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="farm-art-fallback">
      <Icon size={small ? 25 : 60} aria-hidden="true" />
      {!small && <small>Biểu tượng loại · Chưa có ảnh xác minh</small>}
    </span>
  );
}
function Fact({
  label,
  fact,
}: {
  label: string;
  fact: FarmFact<string | number> | null;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd
        className={
          label === "Giá" && String(fact?.value).endsWith(" AC")
            ? "farm-ac-price"
            : undefined
        }
      >
        {fact ? <a href={fact.source}>{fact.value}</a> : "Chưa xác minh"}
      </dd>
    </div>
  );
}
function ItemDetail({
  item,
  region,
  onClose,
}: {
  item: FarmItem;
  region: string;
  onClose: () => void;
}) {
  return (
    <article
      className="farm-detail"
      aria-labelledby="farm-item-title"
      data-item-id={item.id}
    >
      <button className="farm-mobile-back" onClick={onClose}>
        <ArrowLeft size={16} aria-hidden="true" /> Danh sách trang bị
      </button>
      <div className="farm-preview">
        <Art key={item.id} item={item} />
      </div>
      <div className="farm-detail-heading">
        <span>{typeLabel(item.type)}</span>
        <h2 id="farm-item-title">{item.officialName}</h2>
        <a href={farmItemHref(item.id)}>Liên kết vật phẩm</a>
      </div>
      <p className="farm-source-status">
        {item.verificationStatus === "needs_review"
          ? "Cần đối chiếu điều kiện"
          : "Tên, loại và nơi nhận đã đối chiếu Wiki"}{" "}
        · Đọc nguồn {item.retrievedAt}
      </p>
      {item.reviewReason && <p className="farm-review">{item.reviewReason}</p>}
      <dl className="farm-facts">
        <Fact label="Nơi nhận" fact={item.location} />
        <Fact label="Level yêu cầu" fact={item.requiredLevel} />
        <Fact
          label="Membership"
          fact={item.membership?.value === "unknown" ? null : item.membership}
        />
        <Fact label="Giá" fact={item.price} />
        <Fact
          label="Availability"
          fact={{
            ...item.availability,
            value: availability[item.availability.value],
          }}
        />
        {item.stability && (
          <Fact label="Weapon stability" fact={item.stability} />
        )}
      </dl>
      {region === "all" && item.joinCommand && (
        <p>
          Đến map:{" "}
          <a href={item.joinCommand.source}>
            <code>{item.joinCommand.value}</code>
          </a>
        </p>
      )}
      {item.verificationStatus === "verified" && item.boosts.length > 0 && (
        <ul className="farm-bonuses" aria-label="Bonus đã đối chiếu">
          {item.boosts.map((b) => (
            <li key={b.value}>
              <a href={b.source}>{b.value}</a>
            </li>
          ))}
        </ul>
      )}
      {item.classHref && (
        <p>
          <a href={item.classHref}>
            Xem kỹ năng & combo tại trang Class · {item.officialName}
          </a>
        </p>
      )}
      <h3>Cách nhận</h3>
      {item.prerequisites.length > 0 && (
        <ul>
          {item.prerequisites.map((p) => (
            <li key={p.value}>
              <a href={p.source}>{p.value}</a>
            </li>
          ))}
        </ul>
      )}
      {item.acquisition.length > 1 && (
        <p>Các cách nhận thay thế; chỉ cần chọn một cách.</p>
      )}
      {farmRoutes(item, region).map((route) => (
        <section className="farm-acquisition" key={route.id}>
          <h4>
            {route.method}
            {item.acquisition.length > 1 ? " · " + route.id : ""}
          </h4>
          <p>{route.description}</p>
          {route.location && (
            <p>
              <a href={route.location.source}>{route.location.value}</a>
            </p>
          )}
          {route.joinCommand && (
            <p>
              Map:{" "}
              <a href={route.joinCommand.source}>
                <code>{route.joinCommand.value}</code>
              </a>
            </p>
          )}
          {route.steps && (
            <ol>
              {route.steps.map((step, index) => (
                <li key={index}>
                  <a href={step.source}>{step.value}</a>
                </li>
              ))}
            </ol>
          )}
          {route.materialTree ? (
            <MaterialTree
              tree={route.materialTree}
              scope={"farm:" + item.id + ":" + route.id}
            />
          ) : route.steps ? null : (
            <p>Chuỗi điều kiện chưa đối chiếu đầy đủ; xem nguồn bên dưới.</p>
          )}
          <a href={route.source}>Nguồn cách nhận · Wiki</a>
        </section>
      ))}
      <p className="farm-source-status">
        Danh sách chỉ gồm các cách nhận đã đối chiếu. Ngày đọc nguồn không xác
        nhận thời điểm mở trong game. Checklist ghi tiến độ trên thiết bị.
      </p>
      <details className="farm-evidence">
        <summary>Nguồn & hướng dẫn đầy đủ</summary>
        <ul>
          {item.sources.map((url) => (
            <li key={url}>
              <a href={url}>AQWorlds Wiki · {item.officialName}</a>
            </li>
          ))}
          {item.regionEvidence.map((url) => (
            <li key={url}>
              <a href={url}>Bằng chứng Region · {url.split("/").pop()}</a>
            </li>
          ))}
          {item.communityEvidence.guideHrefs.map((href) => (
            <li key={href}>
              <a href={href}>
                Hướng dẫn cộng đồng ·{" "}
                {manifest.guideRecords.find((g) => g.href === href)?.title ||
                  href.split("/").pop()}
              </a>
            </li>
          ))}
          <li>
            <a href={item.communityEvidence.url}>Google Docs gốc</a> · bản xuất
            đọc {item.communityEvidence.readAt}
            {!item.communityEvidence.sourceIndices.length
              ? " · Item bổ sung từ registry trang bị và Wiki"
              : ""}
          </li>
        </ul>
        {item.image && (
          <p>
            Ảnh: {item.image.credit} · <a href={item.image.source}>Nguồn ảnh</a>
          </p>
        )}
      </details>
    </article>
  );
}
export function Directory({ slug }: { slug?: string }) {
  const direct = items.find((i) => i.id === slug);
  const [mode, setMode] = useState(
    direct && !farmableNow(direct) ? "reference" : "now",
  );
  const [sort, setSort] = useState("name");
  const [regionQuery, setRegionQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(Boolean(direct));
  const [urlReady, setUrlReady] = useState(false);
  const panes = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState(
    direct?.regionId || (direct ? unknownFarmRegion : regions[0].id),
  );
  const [type, setType] = useState<string>(direct?.type || "weapon");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(direct?.id);
  // On phones the two panes replace each other. Keep keyboard focus in the visible pane.
  useEffect(() => {
    if (!window.matchMedia("(max-width: 640px)").matches) return;
    const selector = mobileOpen
      ? ".farm-mobile-back"
      : '.farm-item-row[aria-pressed="true"]';
    if (panes.current?.contains(document.activeElement) || mobileOpen)
      panes.current?.querySelector<HTMLButtonElement>(selector)?.focus();
  }, [mobileOpen, selectedId]);
  useEffect(() => {
    if (direct) {
      setMode(farmableNow(direct) ? "now" : "reference");
      setMobileOpen(true);
      setRegion(direct.regionId || unknownFarmRegion);
      setType(direct.type);
      setSelectedId(direct.id);
      setQuery("");
    }
  }, [direct]);
  useEffect(() => {
    const readUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (!direct) {
        const id = params.get("item");
        const item = items.find((i) => i.id === id);
        setMode(
          ["now", "seasonal", "reference"].includes(params.get("view") || "")
            ? params.get("view")!
            : "now",
        );
        const r = params.get("region");
        setRegion(
          r === "all" ||
            r === unknownFarmRegion ||
            regions.some((v) => v.id === r)
            ? r!
            : regions[0].id,
        );
        const t = params.get("category");
        setType(
          t === "all" || farmTypes.some((v) => v.id === t) ? t! : "weapon",
        );
        setSelectedId(item?.id);
        setMobileOpen(Boolean(item));
        setQuery(params.get("q") || "");
        setSort(params.get("sort") === "verified" ? "verified" : "name");
      }
      setUrlReady(true);
    };
    readUrl();
    window.addEventListener("popstate", readUrl);
    return () => window.removeEventListener("popstate", readUrl);
  }, [slug]);
  const visibleItems = items.filter((i) =>
    mode === "now"
      ? farmableNow(i)
      : mode === "seasonal"
        ? i.verificationStatus === "verified" &&
          i.availability.value === "seasonal"
        : true,
  );
  const counts = farmRegionCounts(visibleItems, regions, query).filter(
      (r) => r.count > 0 || r.id === region || r.id === "all",
    ),
    choices = filterFarm(visibleItems, region, type, query).sort((a, b) =>
      sort === "verified"
        ? b.retrievedAt.localeCompare(a.retrievedAt) ||
          a.officialName.localeCompare(b.officialName)
        : a.officialName.localeCompare(b.officialName),
    );
  const selected = choices.find((i) => i.id === selectedId) || choices[0];
  const currentRegion = regions.find((r) => r.id === region);
  useEffect(() => {
    if (!urlReady) return;
    if (
      direct &&
      selected?.id === direct.id &&
      region === (direct.regionId || unknownFarmRegion) &&
      type === direct.type &&
      !query &&
      mode === (farmableNow(direct) ? "now" : "reference")
    )
      return;
    const params = new URLSearchParams({ region, category: type, view: mode });
    if (selected) params.set("item", selected.id);
    if (query) params.set("q", query);
    if (sort !== "name") params.set("sort", sort);
    window.history.replaceState(window.history.state, "", "/farm?" + params);
  }, [region, type, mode, selected?.id, query, sort, urlReady, direct]);
  function chooseMode(value: string) {
    setMode(value);
    setRegion("all");
    setType("all");
    setSelectedId(undefined);
    setMobileOpen(false);
  }
  function chooseRegion(id: string) {
    setRegion(id);
    setType(
      farmTypes.find((t) => filterFarm(visibleItems, id, t.id, query).length)
        ?.id || "weapon",
    );
    setSelectedId(undefined);
    setMobileOpen(false);
  }
  return (
    <main id="main" className="farm-codex" data-ui>
      <Breadcrumb
        items={[
          { label: "Farm", ...(slug ? { href: "/farm" } : {}) },
          ...(direct ? [{ label: direct.officialName }] : []),
        ]}
      />
      <div className="farm-title">
        <div>
          <h1>Farm Codex</h1>
          <p>Chọn Region, loại trang bị, rồi xem cách nhận.</p>
        </div>
        <label className="farm-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Tìm trang bị trong mọi Region</span>
          <input
            type="search"
            placeholder="Tên trang bị, map, quest…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="farm-controls">
        <label>
          Phạm vi{" "}
          <select
            aria-label="Phạm vi availability"
            value={mode}
            onChange={(e) => chooseMode(e.target.value)}
          >
            <option value="now">Farmable Now · thường trực</option>
            <option value="seasonal">Seasonal · cần kiểm tra sự kiện mở</option>
            <option value="reference">
              Tham khảo · gồm dữ liệu cần xác minh
            </option>
          </select>
        </label>
        <label>
          Sắp xếp{" "}
          <select
            aria-label="Sắp xếp trang bị"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Tên A–Z</option>
            <option value="verified">Đối chiếu gần nhất</option>
          </select>
        </label>
      </div>
      {mode !== "now" && (
        <p className="farm-review" role="status">
          {mode === "seasonal"
            ? "Vật phẩm theo mùa; chưa xác nhận sự kiện đang mở trong game."
            : "Khu tham khảo: có mục chưa rõ Region, availability hoặc điều kiện nhận. Không tính là Farmable Now."}
        </p>
      )}
      <div className="farm-workspace">
        <aside className="farm-regions" aria-label="Region">
          <h2>Region</h2>
          <label className="farm-region-search">
            Tìm Region
            <input
              type="search"
              value={regionQuery}
              onChange={(e) => setRegionQuery(e.target.value)}
            />
          </label>
          <label className="farm-mobile-region">
            Chọn Region
            <select
              value={region}
              onChange={(e) => chooseRegion(e.target.value)}
            >
              {counts
                .filter((r) =>
                  r.name.toLowerCase().includes(regionQuery.toLowerCase()),
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.count})
                  </option>
                ))}
            </select>
          </label>
          <div className="farm-region-list">
            {counts
              .filter((r) =>
                r.name.toLowerCase().includes(regionQuery.toLowerCase()),
              )
              .map((r) => (
                <button
                  key={r.id}
                  aria-pressed={r.id === region}
                  onClick={() => chooseRegion(r.id)}
                >
                  <span>{r.name}</span>
                  <span>{r.count}</span>
                </button>
              ))}
          </div>
          <p>
            Tìm kiếm đếm kết quả trong mọi Region. Chọn Region để xem danh sách.
          </p>
        </aside>
        <section className="farm-inventory" aria-label="Kho trang bị">
          <div className="farm-region-heading">
            <h2>
              {currentRegion?.name ||
                (region === "all" ? "Tất cả Region" : "Chưa xác minh Region")}
            </h2>
            <p>
              {currentRegion?.mappingNote ||
                (region === "all"
                  ? "Đếm mỗi vật phẩm một lần, kể cả khi có nhiều cách nhận."
                  : "Chưa đủ bằng chứng về Region địa lý.")}
            </p>
          </div>
          <div
            className="farm-type-tabs"
            role="group"
            aria-label="Loại trang bị trong Region"
          >
            {[{ id: "all", label: "Tất cả" }, ...farmTypes].map((t) => (
              <button
                key={t.id}
                disabled={!filterFarm(visibleItems, region, t.id, query).length}
                aria-pressed={type === t.id}
                onClick={() => {
                  setType(t.id);
                  setSelectedId(undefined);
                  setMobileOpen(false);
                }}
              >
                <CategoryIcon type={t.id} />
                {t.label}
                <span>
                  {filterFarm(visibleItems, region, t.id, query).length}
                </span>
              </button>
            ))}
          </div>
          <div
            ref={panes}
            className={"farm-panes" + (mobileOpen ? " farm-show-detail" : "")}
          >
            <section className="farm-list-pane" aria-label="Danh sách trang bị">
              <p className="farm-list-count" role="status">
                {choices.length} trang bị · {typeLabel(type)}
              </p>
              <div className="farm-item-list">
                {choices.map((i) => (
                  <button
                    className="farm-item-row"
                    key={i.id}
                    aria-pressed={selected?.id === i.id}
                    onClick={() => {
                      setSelectedId(i.id);
                      setMobileOpen(true);
                    }}
                  >
                    <Art item={i} small />
                    <span>
                      <strong>{i.officialName}</strong>
                      <small>
                        {i.requiredLevel
                          ? `Lv ${i.requiredLevel.value} · `
                          : ""}
                        {typeLabel(i.type)} ·{" "}
                        {farmRoutes(i, region)
                          .map((r) => r.method)
                          .filter((v, n, a) => a.indexOf(v) === n)
                          .join(" / ")}{" "}
                        ·{" "}
                        {i.verificationStatus === "needs_review"
                          ? "Cần đối chiếu"
                          : "Wiki đã đối chiếu"}
                        {i.availability.value === "seasonal"
                          ? " · Seasonal"
                          : i.availability.value !== "available"
                            ? " · " + availability[i.availability.value]
                            : ""}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              {!choices.length && (
                <p className="farm-empty">
                  Không có trang bị phù hợp trong Region này. Chọn loại khác
                  hoặc xem số kết quả ở Region bên cạnh.
                </p>
              )}
            </section>
            {selected ? (
              <ItemDetail
                key={selected.id}
                item={selected}
                region={region}
                onClose={() => setMobileOpen(false)}
              />
            ) : (
              <div className="farm-empty">
                Chọn loại có trang bị để xem cách nhận.
              </div>
            )}
          </div>
        </section>
      </div>
      <details className="farm-import-report">
        <summary>Phạm vi nhập & nguồn chưa hoàn tất</summary>
        <p>
          {items.length} item ({manifest.coverage.verifiedItemRecords} đã đối
          chiếu, {items.length - manifest.coverage.verifiedItemRecords} cần
          review); {regions.length} Regions, {manifest.coverage.mappedItems}{" "}
          item đã gán Region, {manifest.coverage.unknownRegionItems} chưa gán.{" "}
          {manifest.coverage.imageItems}/{items.length} item có ảnh được duyệt.
        </p>
        <p>
          Bản xuất Docs: {manifest.source.readAt}. Google Docs gốc chưa truy cập
          được trong lần kiểm tra {manifest.source.retrievalAttemptAt}. Đây là
          đợt nhập đầu tiên, chưa phải toàn bộ trang bị trong tài liệu.
        </p>
        <p>
          {manifest.coverage.sourceGuideRecords} chương nguồn (
          {manifest.coverage.unmappedGuideRecords} chưa ánh xạ);{" "}
          {manifest.coverage.goalRecords} dòng mục tiêu (
          {manifest.coverage.unmappedGoalRecords} chưa ánh xạ). Các dòng có cả
          Class, nhà, nguyên liệu, set và cơ chế; không đồng nghĩa số trang bị
          còn thiếu.
        </p>
        <ul>
          {manifest.unresolvedSources.map((s) => (
            <li key={s.url}>
              <a href={s.url}>{s.candidate}</a>: chưa truy xuất được nguồn Wiki.
            </li>
          ))}
        </ul>
        <details>
          <summary>Các chương nguồn chưa ánh xạ</summary>
          <ul>
            {manifest.guideRecords
              .filter((g) => !g.itemIds.length)
              .map((g) => (
                <li key={g.id}>
                  <a href={g.href}>{g.title}</a>
                </li>
              ))}
          </ul>
        </details>
      </details>
    </main>
  );
}

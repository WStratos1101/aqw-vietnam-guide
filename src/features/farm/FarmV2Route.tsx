import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bird,
  BookOpen,
  Copy,
  Flag,
  Info,
  Map as MapIcon,
  Package,
  Route,
  Search,
  Shield,
  Shirt,
  Swords,
} from "lucide-react";
import farmData from "../../content/farm/catalog-v2.generated.json";
import {
  categories,
  matchesRegion,
  routesFor,
  UNKNOWN_REGION,
} from "../../lib/farm-v2.mjs";
import type {
  FarmV2Item as Item,
  FarmV2RouteData,
  Source,
} from "../../types/farm-v2";
import type { MaterialNode } from "../../lib/material-requirements.mjs";
import { MaterialTree } from "../ultra/MaterialTree";
import "./farm-v2.css";
const catalog = farmData as unknown as {
  items: Item[];
  regions: { id: string; name: string }[];
};
const icons = {
  Weapons: Swords,
  Armors: Shirt,
  Helms: Shield,
  "Capes / Back Items": Flag,
  Pets: Bird,
  Classes: BookOpen,
};
const categoryAliases: Record<string, string> = {
  weapon: "Weapons",
  armor: "Armors",
  helm: "Helms",
  cape: "Capes / Back Items",
  pet: "Pets",
  class: "Classes",
};
const availabilityLabels: Record<string, string> = {
  available: "Có thể nhận",
  unknown: "Chưa rõ thời điểm mở",
  seasonal: "Seasonal",
  rare: "Rare",
  legacy: "Legacy",
};
const tabDefs = [
  { id: "overview", name: "Thông tin", Icon: Info },
  { id: "methods", name: "Cách nhận", Icon: Route },
  { id: "materials", name: "Nguyên liệu", Icon: Package },
  { id: "guide", name: "Hướng dẫn Farm", Icon: MapIcon },
  { id: "sources", name: "Nguồn", Icon: BookOpen },
] as const;
type Tab = (typeof tabDefs)[number]["id"];
type State = {
  region: string;
  category: string;
  query: string;
  selected: string;
  view: string;
  subtype: string;
};
function initialState(slug?: string): State {
  const p = new URLSearchParams(
    typeof window === "undefined" ? "" : window.location.search,
  );
  const direct = slug || p.get("item") || "";
  const item = catalog.items.find((i) => i.id === direct);
  const region =
    p.get("region") === "unverified"
      ? UNKNOWN_REGION
      : p.get("region") || "all";
  const category =
    categoryAliases[p.get("category") || ""] || p.get("category") || "all";
  return {
    region: [
      "all",
      UNKNOWN_REGION,
      ...catalog.regions.map((r) => r.id),
    ].includes(region)
      ? region
      : "all",
    category: ["all", ...categories].includes(category) ? category : "all",
    query: p.get("q") || "",
    selected: item?.id || "",
    view: ["now", "seasonal", "reference"].includes(p.get("view") || "")
      ? p.get("view")!
      : "reference",
    subtype: p.get("subtype") || "",
  };
}
const isNow = (i: Item) =>
  i.verificationStatus === "verified" &&
  i.availability === "available" &&
  i.acquisitionRoutes.some((r) => r.regionId);
const matchesView = (i: Item, view: string) =>
  view === "now"
    ? isNow(i)
    : view === "seasonal"
      ? i.availability === "seasonal"
      : true;
const show = (v: unknown) =>
  v === null || v === undefined || v === "" || v === "unknown"
    ? "Chưa xác minh"
    : String(v);
const localImage = (s?: string | null) =>
  s?.startsWith("/") && !s.startsWith("//") ? s : null;
function CategoryIcon({ category }: { category: string }) {
  const Icon = icons[category as keyof typeof icons] || Shield;
  return <Icon size={20} aria-hidden="true" />;
}
function PreviewImage({
  item,
  large = false,
}: {
  item: Item;
  large?: boolean;
}) {
  const src = localImage(large ? item.previewImage || item.image : item.image);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  return (
    <div className={"fv2-image " + (large ? "fv2-image-large" : "")}>
      {src && !broken ? (
        <img
          loading={large ? "eager" : "lazy"}
          decoding="async"
          src={src}
          alt={large ? item.name : ""}
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          className="fv2-placeholder"
          aria-label="Biểu tượng loại; chưa có ảnh item xác minh"
        >
          <CategoryIcon category={item.category} />
          <small>{large ? "Chưa có ảnh xác minh" : "Thiếu ảnh"}</small>
        </span>
      )}
    </div>
  );
}
function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <div className="fv2-sources">
      {[...new Map(sources.map((s) => [s.url, s])).values()].map((s) => (
        <a href={s.url} key={s.url} target="_blank" rel="noopener noreferrer">
          {s.label}
          <span aria-hidden="true">↗</span>
        </a>
      ))}
    </div>
  );
}
function CopyJoin({ value }: { value: string }) {
  const [status, setStatus] = useState("");
  useEffect(() => setStatus(""), [value]);
  return (
    <div>
      <button
        className="fv2-smallbtn"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("Đã chép");
          } catch {
            setStatus("Không chép được. Hãy chọn và chép lệnh bên dưới.");
          }
        }}
      >
        <Copy size={14} aria-hidden="true" /> Sao chép <code>{value}</code>
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
function MaterialSources({
  node,
  onItemClick,
}: {
  node: MaterialNode;
  onItemClick: (id: string) => void;
}) {
  if (node.kind !== "item")
    return (
      <>
        {node.requirements.map((n, i) => (
          <MaterialSources key={i} node={n} onItemClick={onItemClick} />
        ))}
      </>
    );
  const item = catalog.items.find(
    (i) => i.id === node.itemId || i.originalName === node.name,
  );
  return (
    <details className="fv2-material-source">
      <summary>
        {node.name} ×{node.quantity.toLocaleString("vi-VN")}
      </summary>
      <p>
        <a href={node.source} target="_blank" rel="noopener noreferrer">
          Nguồn nguyên liệu
        </a>
        {item && (
          <button
            className="fv2-linkbutton"
            type="button"
            onClick={() => onItemClick(item.id)}
          >
            Xem {item.name}
          </button>
        )}
      </p>
    </details>
  );
}
function RouteChips({
  routes,
  selected,
  onChange,
}: {
  routes: FarmV2RouteData[];
  selected: string;
  onChange: (id: string) => void;
}) {
  if (routes.length < 2) return null;
  return (
    <div className="fv2-route-chips" aria-label="Chọn cách nhận">
      {routes.map((r, i) => (
        <button
          type="button"
          aria-pressed={r.id === selected}
          className={r.id === selected ? "active" : ""}
          key={r.id}
          onClick={() => onChange(r.id)}
        >
          {r.method} · {r.location || `Tuyến ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
function Detail({
  item,
  region,
  onItemClick,
  onBack,
  returning,
}: {
  item: Item;
  region: string;
  onItemClick: (id: string) => void;
  onBack: () => void;
  returning: boolean;
}) {
  const id = useId();
  const routes = routesFor(item, region);
  const [selectedRoute, setSelectedRoute] = useState(routes[0]?.id || "");
  const route = routes.find((r) => r.id === selectedRoute) || routes[0];
  const available = tabDefs.filter(
    (t) => t.id !== "materials" || Boolean(route?.materialTree),
  );
  const [tab, setTab] = useState<Tab>("overview");
  const activeTab = available.some((t) => t.id === tab) ? tab : "overview";
  const selectRoute = (next: string) => {
    setSelectedRoute(next);
    if (tab === "materials" && !routes.find((r) => r.id === next)?.materialTree)
      setTab("methods");
  };
  const sources = [...item.sources, ...(route?.sources || [])];
  return (
    <section
      className="fv2-detail"
      data-item-id={item.id}
      aria-labelledby={id + "-title"}
    >
      <button
        type="button"
        className={"fv2-back " + (returning ? "fv2-return" : "")}
        onClick={onBack}
      >
        <ArrowLeft size={16} aria-hidden="true" />{" "}
        {returning ? "Quay lại trang bị trước" : "Quay lại danh sách"}
      </button>
      <div className="fv2-hero">
        <PreviewImage item={item} large />
        <div className="fv2-heading">
          <span className="fv2-kicker">
            {item.category}
            {item.subtype ? " · " + item.subtype : ""}
          </span>
          <h2 id={id + "-title"}>{item.name}</h2>
          <div className="fv2-tags">
            <span>
              {item.verificationStatus === "verified"
                ? "Wiki snapshot đã đối chiếu"
                : "Cần đối chiếu"}
            </span>
            <span>
              {availabilityLabels[item.availability || "unknown"] ||
                item.availability}
            </span>
          </div>
          <a href={"/farm/item/" + item.id}>Liên kết vật phẩm</a>
        </div>
      </div>
      <div className="fv2-specs">
        <div>
          <small>Level yêu cầu</small>
          <strong>{show(item.level)}</strong>
        </div>
        <div>
          <small>Membership</small>
          <strong>{show(item.membership)}</strong>
        </div>
        <div>
          <small>Rarity</small>
          <strong>{show(item.rarity)}</strong>
        </div>
        <div>
          <small>Availability</small>
          <strong>
            {availabilityLabels[item.availability || "unknown"] ||
              show(item.availability)}
          </strong>
        </div>
      </div>
      {item.effects.length > 0 && (
        <div className="fv2-effects">
          {item.effects.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
      )}
      <div
        className="fv2-tabs"
        role="tablist"
        aria-label="Nội dung trang bị"
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
            return;
          e.preventDefault();
          const current = available.findIndex((t) => t.id === activeTab);
          const next =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? available.length - 1
                : (current +
                    (e.key === "ArrowRight" ? 1 : -1) +
                    available.length) %
                  available.length;
          setTab(available[next].id);
          e.currentTarget
            .querySelectorAll<HTMLButtonElement>('[role="tab"]')
            [next]?.focus();
        }}
      >
        {available.map(({ id: tabId, name, Icon }) => (
          <button
            role="tab"
            type="button"
            id={`${id}-${tabId}-tab`}
            aria-controls={`${id}-panel`}
            aria-selected={activeTab === tabId}
            tabIndex={activeTab === tabId ? 0 : -1}
            className={activeTab === tabId ? "active" : ""}
            key={tabId}
            onClick={() => setTab(tabId)}
          >
            <Icon size={16} aria-hidden="true" />
            {name}
          </button>
        ))}
      </div>
      <div
        className="fv2-tab-body"
        role="tabpanel"
        id={id + "-panel"}
        aria-labelledby={`${id}-${activeTab}-tab`}
        tabIndex={0}
      >
        {activeTab === "overview" && (
          <>
            <p className="fv2-muted">
              Đối chiếu thông số: {item.lastChecked || "Chưa xác minh đầy đủ"}.
              Availability chưa được xác nhận trong game.
            </p>
            {item.reviewReason && <p>{item.reviewReason}</p>}
            {!!item.prerequisites?.length && (
              <>
                <h3>Điều kiện chung theo nguồn</h3>
                <ul>
                  {item.prerequisites.map((p, i) => (
                    <li key={i}>
                      <a href={p.source}>{p.value}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {item.classHref && (
              <a href={item.classHref}>Xem kỹ năng và combo Class</a>
            )}
          </>
        )}
        {["methods", "materials", "guide"].includes(activeTab) && (
          <RouteChips
            routes={routes}
            selected={route?.id || ""}
            onChange={selectRoute}
          />
        )}
        {activeTab === "methods" &&
          (route ? (
            <div className="fv2-method">
              <h3>{route.method}</h3>
              <p>{route.description}</p>
              {!!item.prerequisites?.length && (
                <>
                  <h3>Điều kiện chung theo nguồn</h3>
                  <ul>
                    {item.prerequisites.map((p, i) => (
                      <li key={i}>
                        <a href={p.source}>{p.value}</a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {route.location && (
                <p>
                  <b>Nơi nhận:</b> {route.location}
                </p>
              )}
              <p className="fv2-muted">
                Region:{" "}
                {catalog.regions.find((r) => r.id === route.regionId)?.name ||
                  "Chưa xác minh"}
              </p>
              {route.mapCommand && <CopyJoin value={route.mapCommand} />}{" "}
              {!!route.prerequisites?.length && (
                <>
                  <h3>Điều kiện tuyến nhận</h3>
                  <ul>
                    {route.prerequisites.map((p, i) => (
                      <li key={i}>
                        <a href={p.source}>{p.value}</a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <SourceLinks sources={route.sources} />
            </div>
          ) : (
            <p>Chưa có tuyến nhận được xác minh cho Region này.</p>
          ))}
        {activeTab === "materials" && route?.materialTree && (
          <>
            <MaterialTree
              tree={route.materialTree}
              scope={`farm:${item.id}:${route.id}`}
            />
            <MaterialSources
              node={route.materialTree}
              onItemClick={onItemClick}
            />
          </>
        )}
        {activeTab === "guide" &&
          (route ? (
            <div className="fv2-guide">
              {route.mapCommand && <CopyJoin value={route.mapCommand} />}{" "}
              {route.steps.length ? (
                <ol>
                  {route.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              ) : (
                <p>
                  Chưa có hướng dẫn từng bước được đối chiếu nguồn. Xem Cách
                  nhận và Nguồn.
                </p>
              )}
              <SourceLinks sources={route.sources} />
            </div>
          ) : (
            <p>Chưa có hướng dẫn Farm cho Region này.</p>
          ))}
        {activeTab === "sources" && (
          <>
            <p className="fv2-muted">
              Tên / loại: {item.wikiUrl}.{" "}
              {item.verificationStatus === "verified"
                ? `Snapshot ${item.lastChecked}; không phải kiểm tra trực tiếp hôm nay.`
                : "Region, routes, nguyên liệu và availability còn cần đối chiếu."}
            </p>
            {item.imageEvidence && (
              <p className="fv2-muted">
                Ảnh: {item.imageEvidence.credit} ·{" "}
                <a href={item.imageEvidence.source}>Nguồn ảnh</a>
              </p>
            )}
            <SourceLinks sources={sources} />
            {item.provenance.map((p) => (
              <p className="fv2-muted" key={p.sourceUrl}>
                {p.sourceDocument}: dòng {p.lines.join(", ")} · đọc{" "}
                {p.lastChecked}
              </p>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
export function FarmV2Route({ slug }: { slug?: string }) {
  const [state, setState] = useState<State>(() => initialState(slug));
  const { region, category, query, selected, view, subtype } = state;
  const [visibleCount, setVisibleCount] = useState(80);
  const [detailMobile, setDetailMobile] = useState(
    Boolean(slug || state.selected),
  );
  const [returns, setReturns] = useState<State[]>([]);
  const container = useRef<HTMLElement>(null);
  const lastSlug = useRef(slug);
  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    setState(next);
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries({
      region: next.region,
      category: next.category,
      q: next.query,
      item: next.selected,
      view: next.view,
      subtype: next.subtype,
    }))
      if (value && value !== "all") p.set(key, value);
    window.history.replaceState(
      window.history.state,
      "",
      "/farm" + (p.size ? "?" + p.toString() : ""),
    );
  };
  useEffect(() => {
    const load = () => {
      const next = initialState();
      setState(next);
      setDetailMobile(Boolean(next.selected));
      setReturns([]);
    };
    window.addEventListener("popstate", load);
    return () => window.removeEventListener("popstate", load);
  }, []);
  useEffect(() => {
    if (lastSlug.current === slug) return;
    lastSlug.current = slug;
    setState(initialState(slug));
    setDetailMobile(Boolean(slug));
    setReturns([]);
  }, [slug]);
  const scoped = useMemo(
    () =>
      catalog.items.filter(
        (i) =>
          matchesView(i, view) &&
          (!query ||
            i.name
              .toLocaleLowerCase("en")
              .includes(query.trim().toLocaleLowerCase("en"))),
      ),
    [view, query],
  );
  const filtered = useMemo(
    () =>
      scoped.filter(
        (i) =>
          matchesRegion(i, region) &&
          (category === "all" || i.category === category) &&
          (!subtype || i.subtype === subtype),
      ),
    [scoped, region, category, subtype],
  );
  const active = filtered.find((i) => i.id === selected) || filtered[0] || null;
  const regionCounts = [
    { id: "all", name: "Tất cả Region" },
    ...catalog.regions,
    { id: UNKNOWN_REGION, name: "Chưa xác minh Region" },
  ].map((r) => ({
    ...r,
    count: scoped.filter((i) => matchesRegion(i, r.id)).length,
  }));
  const subtypes = [
    ...new Set(
      scoped
        .filter(
          (i) =>
            matchesRegion(i, region) &&
            (category === "all" || i.category === category),
        )
        .map((i) => i.subtype)
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  useEffect(
    () => setVisibleCount(80),
    [region, category, query, view, subtype],
  );
  useEffect(() => {
    if (!window.matchMedia("(max-width: 720px)").matches) return;
    const selector = detailMobile ? ".fv2-back" : ".fv2-item.active";
    container.current?.querySelector<HTMLButtonElement>(selector)?.focus();
  }, [detailMobile, active?.id]);
  const chooseItem = (id: string) => {
    update({ selected: id });
    setDetailMobile(true);
  };
  const clickMat = (id: string) => {
    if (!catalog.items.some((i) => i.id === id)) return;
    setReturns([...returns, { ...state, selected: active?.id || selected }]);
    update({
      region: "all",
      category: "all",
      query: "",
      selected: id,
      view: "reference",
      subtype: "",
    });
    setDetailMobile(true);
  };
  const back = () => {
    if (returns.length) {
      update(returns[returns.length - 1]);
      setReturns(returns.slice(0, -1));
    } else setDetailMobile(false);
  };
  return (
    <main id="main" className="fv2-root" ref={container}>
      <header className="fv2-top">
        <div>
          <h1>Farm Inventory</h1>
          <p>Region → Loại trang bị → Vật phẩm</p>
        </div>
        <label className="fv2-search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Tìm trang bị"
            value={query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Tìm trang bị..."
          />
        </label>
      </header>
      <p className="fv2-muted">
        Danh mục đang đối chiếu nguồn. Mục chưa rõ Region hoặc thời điểm mở được
        giữ riêng; ảnh thiếu có nhãn.
      </p>
      <label className="fv2-view">
        Phạm vi availability{" "}
        <select
          aria-label="Phạm vi availability"
          value={view}
          onChange={(e) => {
            update({ view: e.target.value, selected: "" });
            setDetailMobile(false);
          }}
        >
          <option value="reference">Tất cả · gồm mục cần đối chiếu</option>
          <option value="now">Đã xác minh có thể nhận</option>
          <option value="seasonal">Seasonal · chưa xác nhận đang mở</option>
        </select>
      </label>
      <div
        className={
          "fv2-layout " + (detailMobile ? "fv2-show-mobile-detail" : "")
        }
      >
        <aside className="fv2-regions">
          <h2>Region</h2>
          <nav aria-label="Lọc Region">
            {regionCounts.map((r) => (
              <button
                type="button"
                key={r.id}
                aria-pressed={r.id === region}
                className={r.id === region ? "active" : ""}
                onClick={() => {
                  update({ region: r.id, selected: "" });
                  setDetailMobile(false);
                  setReturns([]);
                }}
              >
                <span>{r.name}</span>
                <b>{r.count}</b>
              </button>
            ))}
          </nav>
        </aside>
        <section className="fv2-inventory" aria-label="Danh sách trang bị">
          <div className="fv2-categories" aria-label="Loại trang bị">
            {["all", ...categories].map((cat) => (
              <button
                type="button"
                aria-pressed={category === cat}
                className={category === cat ? "active" : ""}
                key={cat}
                onClick={() => {
                  update({ category: cat, selected: "", subtype: "" });
                  setDetailMobile(false);
                  setReturns([]);
                }}
              >
                {cat === "all" ? "Tất cả" : cat}{" "}
                <small>
                  {
                    scoped.filter(
                      (i) =>
                        matchesRegion(i, region) &&
                        (cat === "all" || i.category === cat),
                    ).length
                  }
                </small>
              </button>
            ))}
          </div>
          {subtypes.length > 0 && (
            <label>
              Subtype{" "}
              <select
                value={subtype}
                onChange={(e) => update({ subtype: e.target.value })}
              >
                <option value="">Tất cả</option>
                {subtypes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          )}
          <p className="fv2-count">
            {filtered.length} trang bị ·{" "}
            {regionCounts.find((r) => r.id === region)?.name}
          </p>
          <div className="fv2-rows">
            {filtered.slice(0, visibleCount).map((i) => (
              <button
                className={"fv2-item " + (i.id === active?.id ? "active" : "")}
                data-inventory-item={i.id}
                type="button"
                key={i.id}
                onClick={() => chooseItem(i.id)}
                aria-pressed={i.id === active?.id}
              >
                <PreviewImage item={i} />
                <span className="fv2-item-text">
                  <strong>{i.name}</strong>
                  <small>
                    {i.category} · {routesFor(i, region).length} cách nhận ·{" "}
                    {i.verificationStatus === "verified"
                      ? "Wiki snapshot"
                      : "Cần đối chiếu"}
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
            {!filtered.length && (
              <p className="fv2-empty" role="status">
                Không tìm thấy trang bị. Hãy chọn Region hoặc loại khác.
              </p>
            )}
            {visibleCount < filtered.length && (
              <button
                type="button"
                className="fv2-more"
                onClick={() => setVisibleCount((n) => n + 80)}
              >
                Xem thêm ({filtered.length - visibleCount})
              </button>
            )}
          </div>
        </section>
        {active ? (
          <div className="fv2-detail-wrap">
            <Detail
              key={active.id + ":" + region}
              item={active}
              region={region}
              onItemClick={clickMat}
              onBack={back}
              returning={returns.length > 0}
            />
          </div>
        ) : (
          <section className="fv2-detail fv2-no-selection">
            Chọn một trang bị để xem chi tiết.
          </section>
        )}
      </div>
    </main>
  );
}
export default FarmV2Route;

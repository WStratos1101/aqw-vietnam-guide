import { farmTimeLabel } from "../../lib/farm-workflows.mjs";
import classRoleOptions from "../../data/class-roles.json";
import {
  matchesFarmSubtype,
  farmSubtypeOptions,
  farmBoost,
} from "../../lib/farm-details.mjs";
import { FarmGuide } from "./FarmGuide";
import { FarmEquipmentSets } from "./FarmEquipmentSets";
import { farmSetItemHref } from "../../lib/farm-equipment-sets.mjs";
import { FarmWikiInfo } from "./FarmWikiInfo";
import { FarmQuestWorkflow, FarmWorkflowSummary, type WorkflowFocus } from "./FarmQuestWorkflow";
import { FarmRouteFacts } from "./FarmRouteFacts";
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
import groupManifest from "../../../content-sources/farm/faction-groups.json";
import {
  matchesGroup,
  groupCounts,
  resolveGroup,
} from "../../lib/farm-groups.mjs";
import farmData from "../../content/farm/catalog-v2.generated.json";
import {
  categories,
  matchesRegion,
  routesFor,
  UNKNOWN_REGION,
} from "../../lib/farm-v2.mjs";
import type { FarmV2Item as Item, FarmV2RouteData } from "../../types/farm-v2";
import { FarmMaterials } from "./FarmMaterials";
import { FarmTypeIcon } from "./FarmTypeIcon";
import { factionTokens } from "./faction-tokens";
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
  ground: "Grounds",
  grounds: "Grounds",
};
const tabDefs = [
  { id: "overview", name: "Thông tin", Icon: Info },
  { id: "methods", name: "Cách nhận", Icon: Route },
  { id: "materials", name: "Nguyên liệu", Icon: Package },
  { id: "guide", name: "Hướng dẫn Farm", Icon: MapIcon },
  { id: "sets", name: "Set đồ", Icon: Shirt },
] as const;
type Tab = (typeof tabDefs)[number]["id"];
type State = {
  group: string;
  sort: string;
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
  const pathItem =
    typeof window === "undefined"
      ? ""
      : window.location.pathname.match(/^\/farm\/item\/([^/]+)\/?$/)?.[1];
  const direct = slug || p.get("item") || pathItem || "";
  const item = catalog.items.find((i) => i.id === direct);
  const region =
    p.get("region") === "unverified"
      ? UNKNOWN_REGION
      : p.get("region") || "all";
  const category =
    categoryAliases[p.get("category") || ""] || p.get("category") || "all";
  return {
    group: resolveGroup(p.get("group") || "all", groupManifest),
    sort: "name",
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
    subtype: farmSubtypeOptions(
      catalog.items,
      category,
      classRoleOptions,
    ).includes(p.get("subtype") || "")
      ? p.get("subtype")!
      : "",
  };
}
function normalizeSubtypeUrl(state: State) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("subtype");
  if (
    !requested ||
    farmSubtypeOptions(catalog.items, state.category, classRoleOptions).includes(requested)
  ) return;
  params.delete("subtype");
  const search = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + (search ? `?${search}` : "") + window.location.hash,
  );
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
    ? "—"
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
function CopyJoin({ value }: { value: string }) {
  const [status, setStatus] = useState("");
  const match = value.match(/^\s*\/?join\s+([a-z0-9_-]+)\s*$/i);
  const command = match ? `/join ${match[1]}` : null;
  useEffect(() => setStatus(""), [value]);
  if (!command) return null;
  return (
    <div className="fv2-join-command">
      <code>{command}</code>
      <button
        className="fv2-smallbtn"
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(command);
            setStatus("Đã chép");
          } catch {
            setStatus("Không chép được. Hãy chọn và chép lệnh bên trên.");
          }
        }}
      >
        <Copy size={14} aria-hidden="true" /> Sao chép lệnh
      </button>
      <span role="status">{status}</span>
    </div>
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
          aria-label={`Chọn cách nhận: ${r.method} · ${r.location || `Tuyến ${i + 1}`}`}
          title={`${r.method} · ${r.location || `Tuyến ${i + 1}`}`}
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
  onSetItemClick,
}: {
  item: Item;
  region: string;
  onItemClick: (id: string) => void;
  onBack: () => void;
  returning: boolean;
  onSetItemClick: (id: string) => void;
}) {
  const id = useId();
  const filteredRoutes = routesFor(item, region);
  const routes = filteredRoutes.length ? filteredRoutes : item.acquisitionRoutes;
  const readFocus = (): WorkflowFocus => { const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search); return {questId:params.get("farm-quest") || undefined,materialId:params.get("farm-material") || undefined,modeId:params.get("farm-mode") || undefined,optionId:params.get("farm-option") || undefined,dailyRuns:params.has("farm-daily")&&Number.isInteger(Number(params.get("farm-daily")))&&Number(params.get("farm-daily"))>=0&&Number(params.get("farm-daily"))<=15?Number(params.get("farm-daily")):undefined}; };
  const [focus,setFocus] = useState<WorkflowFocus>(readFocus);
  const [selectedRoute, setSelectedRoute] = useState(new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("farm-route") || routes[0]?.id || "");
  const route = routes.find((r) => r.id === selectedRoute) || routes[0];
  const farmTime = route?.farmModes?.find(mode=>mode.id===focus.modeId)?.farmTime || route?.farmModes?.[0]?.farmTime || route?.farmTime;
  const timeLabel=farmTimeLabel(farmTime);
  const hasMaterials = (value?: FarmV2RouteData) => Boolean(value?.materialTree || value?.farmModes?.some(mode=>mode.materials.length) || value?.questWorkflowIds?.length || value?.farmTasks?.some(task => task.rows.length));
  const available = tabDefs.filter(
    (t) => (t.id !== "materials" || hasMaterials(route)) && (t.id !== "sets" || Boolean(item.setIds?.length) || /^(?:Empowered )?Higure$/i.test(item.name.trim())),
  );
  const [tab, setTab] = useState<Tab>(() => (new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("farm-tab") as Tab) || "overview");
  const navigateWorkflow = (next: WorkflowFocus) => {
    const before = new URL(window.location.href);
    before.searchParams.set("farm-tab",tab); before.searchParams.set("farm-route",route.id);
    window.history.replaceState(window.history.state,"",before.pathname+before.search);
    const url = new URL(before);
    const nextTab = next.materialId ? "materials" : next.questId ? "guide" : tab;
    url.searchParams.set("farm-tab",nextTab);
    for(const [key,value] of Object.entries({"farm-quest":next.questId,"farm-material":next.materialId,"farm-mode":next.modeId,"farm-option":next.optionId,"farm-daily":next.dailyRuns==null?undefined:String(next.dailyRuns)})) {
      if(value)url.searchParams.set(key,value); else url.searchParams.delete(key);
    }
    window.history.pushState(window.history.state,"",url.pathname+url.search);
    setFocus(next);setTab(nextTab);
  };
  useEffect(()=>{
    const load = () => { const params=new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);setFocus(readFocus());setTab((params.get("farm-tab") as Tab)||"overview");setSelectedRoute(params.get("farm-route")||routes[0]?.id||""); };
    window.addEventListener("popstate",load);return()=>window.removeEventListener("popstate",load);
  },[item.id]);
  const activeTab = available.some((t) => t.id === tab) ? tab : "overview";
  const selectRoute = (next: string) => {
    setSelectedRoute(next);
    if (tab === "materials" && !hasMaterials(routes.find((r) => r.id === next)))
      setTab("methods");
  };
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
          <a href={item.wikiUrl} target="_blank" rel="noopener noreferrer">Liên kết vật phẩm</a>
        </div>
      </div>
      <div className={"fv2-specs"+(timeLabel?" fv2-specs-with-time":"")}>
        <div>
          <small>Boost</small>
          <strong className="fv2-boost">{farmBoost(item).join(" · ")}</strong>
        </div>
        {timeLabel && <div title={farmTime?.assumptions.join(" ")}><small>Thời gian farm</small><strong>{timeLabel}</strong></div>}
        <div>
          <small>Membership</small>
          <strong>
            {show(
              item.membership && item.membership !== "unknown"
                ? item.membership
                : item.wikiDetails?.membership,
            )}
          </strong>
        </div>
        <div>
          <small>Rarity</small>
          <strong>{show(item.rarity || item.wikiDetails?.rarity)}</strong>
        </div>
      </div>
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
        {activeTab === "sets" && <FarmEquipmentSets item={item} items={catalog.items} onItemClick={onSetItemClick}/>}
        {activeTab === "overview" && <FarmWikiInfo item={item} route={route} />}
        {["methods", "materials", "guide"].includes(activeTab) && (
          <RouteChips
            routes={routes}
            selected={route?.id || ""}
            onChange={selectRoute}
          />
        )}
        {activeTab === "methods" && (route ? <FarmWorkflowSummary brief={item.acquisitionBrief} route={route} focus={focus} onNavigate={navigateWorkflow} /> : <p>Chưa có phương án nhận thông thường được xác minh.</p>)}
        {activeTab === "materials" && route && (route.materialTree && !route.questWorkflowIds?.length && !focus.materialId && !route.farmModes?.length ? (
          <>
            <FarmMaterials
              tree={route.materialTree}
              onItemClick={onItemClick}
              scope={`farm:${item.id}:${route.id}`}
            />
          </>
        ) : <FarmQuestWorkflow itemId={item.id} materialsOnly route={route} focus={focus} onNavigate={navigateWorkflow} />)}
        {activeTab === "guide" && route && <FarmQuestWorkflow key={item.id+":"+route.id} itemId={item.id} route={route} focus={focus} onNavigate={navigateWorkflow} />}

      </div>
    </section>
  );
}
export function FarmV2Route({ slug }: { slug?: string }) {
  const [state, setState] = useState<State>(() => initialState(slug));
  const { group, region, category, query, selected, view, subtype } = state;
  const [visibleCount, setVisibleCount] = useState(80);
  const [detailMobile, setDetailMobile] = useState(
    Boolean(slug || state.selected),
  );
  const [returns, setReturns] = useState<State[]>([]);
  const container = useRef<HTMLElement>(null);
  const lastSlug = useRef(slug);
  const update = (patch: Partial<State>, replace = false) => {
    const next = { ...state, ...patch };
    if (
      next.subtype &&
      !farmSubtypeOptions(
        catalog.items,
        next.category,
        classRoleOptions,
      ).includes(next.subtype)
    )
      next.subtype = "";
    setState(next);
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries({
      group: next.group,

      region: next.region,
      category: next.category,
      q: next.query,
      item: next.selected,
      view: next.view,
      subtype: next.subtype,
    }))
      if (value && value !== "all") p.set(key, value);
    window.history[replace ? "replaceState" : "pushState"](
      window.history.state,
      "",
      "/farm" + (p.size ? "?" + p.toString() : ""),
    );
  };
  useEffect(() => {
    const load = () => {
      const next = initialState();
      normalizeSubtypeUrl(next);
      setState(next);
      setDetailMobile(Boolean(next.selected));
      setReturns([]);
    };
    window.addEventListener("popstate", load);
    normalizeSubtypeUrl(state);
    return () => window.removeEventListener("popstate", load);
  }, []);
  useEffect(() => {
    if (lastSlug.current === slug) return;
    lastSlug.current = slug;
    const next = initialState(slug);
    normalizeSubtypeUrl(next);
    setState(next);
    setDetailMobile(Boolean(next.selected));
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
      scoped
        .filter(
          (i) =>
            matchesGroup(i, group) &&
            matchesRegion(i, region) &&
            (category === "all" || i.category === category) &&
            matchesFarmSubtype(i, category, subtype),
        )
        .sort((a, b) => a.name.localeCompare(b.name, "en")),
    [scoped, group, region, category, subtype],
  );
  const active = filtered.find((i) => i.id === selected) || catalog.items.find(item=>item.id===selected) || filtered[0] || null;
  const counts = groupCounts(scoped, groupManifest.groups);
  const subtypes = farmSubtypeOptions(
    catalog.items.filter(
      (i) => matchesGroup(i, group) && matchesRegion(i, region),
    ),
    category,
    classRoleOptions,
  );
  useEffect(
    () => setVisibleCount(80),
    [group, region, category, query, view, subtype],
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
      group: "all",
      region: "all",
      category: "all",
      query: "",
      selected: id,
      view: "reference",
      subtype: "",
    });
    setDetailMobile(true);
  };
  const openSetItem = (id: string) => {
    const member=catalog.items.find(item=>item.id===id);if(!member)return;
    window.history.pushState(window.history.state,"",farmSetItemHref(member));
    setState(initialState());setDetailMobile(true);
    window.dispatchEvent(new window.PopStateEvent("popstate"));
    window.requestAnimationFrame(()=>container.current?.querySelector(".fv2-detail")?.scrollIntoView({block:"start"}));
  };
  const back = () => {
    if (returns.length) {
      update(returns[returns.length - 1]);
      setReturns(returns.slice(0, -1));
    } else setDetailMobile(false);
  };
  return (
    <main
      id="main"
      className="fv2-root"
      ref={container}
      data-faction={group}
      style={factionTokens(group)}
    >
      <header className="fv2-top">
        <div>
          <h1 className="codex-heading">Farming Codex</h1>
        </div>
        <label className="fv2-search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Tìm trang bị"
            value={query}
            onChange={(e) => update({ query: e.target.value }, true)}
            placeholder="Tìm trang bị..."
          />
        </label>
      </header>
      <p className="aqwvn-page-quip" data-aqwvn-typo="v1">Thấy món đồ lấp lánh kia không? Nghe bảo rơi dễ lắm. Ừ, cứ tin thế đi. Giờ chuẩn bị farm thêm vài trăm lượt nhé!</p>
      {region !== "all" && (
        <p className="fv2-muted">
          Đang dùng bộ lọc địa lý từ liên kết cũ:{" "}
          {catalog.regions.find((r) => r.id === region)?.name ||
            "Chưa xác minh"}
          .{" "}
          <button
            type="button"
            className="fv2-linkbutton"
            onClick={() => update({ region: "all" })}
          >
            Bỏ lọc địa lý
          </button>
        </p>
      )}
      <div
        className={
          "fv2-layout " + (detailMobile ? "fv2-show-mobile-detail" : "")
        }
      >
        <aside className="fv2-groups">
          <h2>Phe phái</h2>
          <nav aria-label="Lọc Phe phái">
            {counts.map((r) => (
              <button
                type="button"
                key={r.id}
                aria-label={`Lọc phe phái: ${r.id === "all" ? "Tất cả" : r.name}`}
                title={r.id === "all" ? "Tất cả phe phái" : r.name}
                aria-pressed={r.id === group}
                className={
                  (r.id === "all" ? "fv2-group-all " : "") +
                  (r.id === group ? "active" : "")
                }
                onClick={() => {
                  update({
                    group: r.id,
                    region: "all",
                    selected: "",
                    subtype: "",
                  });
                  setDetailMobile(false);
                  setReturns([]);
                }}
              >
                <span>{r.id === "all" ? "Tất cả" : r.name}</span>
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
                aria-label={cat === "all" ? "Tất cả" : cat}
                title={cat === "all" ? "Tất cả" : cat}
                onClick={() => {
                  update({ category: cat, selected: "", subtype: "" });
                  setDetailMobile(false);
                  setReturns([]);
                }}
              >
                {<FarmTypeIcon name={cat === "all" ? "Inventory" : cat} />}{" "}
                <small>
                  {
                    scoped.filter(
                      (i) =>
                        matchesGroup(i, group) &&
                        matchesRegion(i, region) &&
                        (cat === "all" || i.category === cat),
                    ).length
                  }
                </small>
              </button>
            ))}
          </div>
          {category === "Weapons" && subtypes.length > 0 && (
              <div className="fv2-subtypes" role="group" aria-label="Subtype">
                {["", ...subtypes].map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label={s || "Tất cả subtype"}
                    title={s || "Tất cả subtype"}
                    aria-pressed={subtype === s}
                    onClick={() => update({ subtype: s })}
                  >
                    {<FarmTypeIcon name={s || "Inventory"} />}
                  </button>
                ))}
              </div>
            )}
          <p className="fv2-count">
            {filtered.length} trang bị ·{" "}
            {counts.find((r) => r.id === group)?.name}
          </p>
          <div className="fv2-rows">
            {filtered.slice(0, visibleCount).map((i) => (
              <button
                className={"fv2-item " + (i.id === active?.id ? "active" : "")}
                data-inventory-item={i.id}
                type="button"
                key={i.id}
                onClick={() => chooseItem(i.id)}
                aria-label={`Chọn ${i.name}`}
                title={i.name}
                aria-pressed={i.id === active?.id}
              >
                <PreviewImage item={i} />
                <span className="fv2-item-text">
                  <strong>{i.name}</strong>
                  <small>
                    {i.category} · {routesFor(i, region).length} cách nhận
                  </small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
            {!filtered.length && (
              <p className="fv2-empty" role="status">
                Không tìm thấy trang bị. Hãy chọn nhóm hoặc loại khác.
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
              onSetItemClick={openSetItem}
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

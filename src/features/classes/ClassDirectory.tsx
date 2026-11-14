import classRoleOptions from "../../data/class-roles.json";
import {classIdentity,classIdentityAliases} from "../../lib/class-identity";
import {
  calendarFamily,
  primaryCalendarClass,
} from "../../lib/calendar-families";
import { calendarCategory, calendarOrder } from "../../lib/class-ui-v12-8.mjs";
import { classColors } from "../../lib/entity-colors.mjs";
import calendar from "../../content/classes/calendar-membership.json";
import { ClassRoles } from "./ClassRoles";
import { useState, type CSSProperties } from "react";
import { Search, ArrowRight } from "lucide-react";
import { classProfiles } from "../../content/classes";
import { filterClasses } from "../../lib/classes";
import type { AqwClass } from "../../types/classes";
import { ClassAsset } from "./ClassAsset";

export function ClassCard({ profile }: { profile: AqwClass }) {
  const family = calendarFamily(profile.id);
  const identity=classIdentity(profile.id,family?.variants[0].name);
  const name = identity?.officialName ?? family?.variants[0].name ?? profile.name;
  return (
    <a
      href={`/class/${profile.slug}`}
      className="class-card"
      style={
        {
          "--class-accent-dark": classColors(profile).dark,
          "--class-accent-light": classColors(profile).light,
        } as CSSProperties
      }
    >
      <ClassAsset id={profile.image} name={name} />
      <div>
        <ClassRoles roles={profile.role} />
        {calendar.some((e) => e.classId === profile.id) && (
          <small className="calendar-year">
            {family?.year ||
              calendar
                .filter((e) => e.classId === profile.id && e.year)
                .map((e) => e.year)
                .sort((a, b) => (a || 0) - (b || 0))[0] ||
              "Năm chưa xác minh"}
          </small>
        )}
        <h2>{name}</h2>
        {identity?.primaryAbbreviation && <small className="class-abbreviation">{identity.primaryAbbreviation}</small>}
        <ArrowRight size={18} />
      </div>
    </a>
  );
}
export function ClassDirectory() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [acquisition, setAcquisition] = useState("all");
  const [page, setPage] = useState(1);
  const cards = classProfiles
    .filter((c) => primaryCalendarClass(c.id) === c.id)
    .map((c) => {
      const family = calendarFamily(c.id);
      if (!family) return {...c,aliases:[...c.aliases,...classIdentityAliases(c.id)]};
      return {
        ...c,
        aliases: [...c.aliases,...classIdentityAliases(c.id), ...family.variants.flatMap((v) => [v.name,...classIdentityAliases(v.classId)])],
        acquisitionType: [
          ...new Set(
            family.variants.flatMap(
              (v) =>
                classProfiles.find((p) => p.id === v.classId)
                  ?.acquisitionType || [],
            ),
          ),
        ],
      };
    });
  const filtered = filterClasses(
    category === "Calendar"
      ? calendarOrder(
          cards.filter((c) => calendarCategory(c, calendar) === "Calendar"),
          calendar,
        )
      : cards.filter(
          (c) =>
            category === "all" || calendarCategory(c, calendar) === category,
        ),
    {
      query,
      role,
      difficulty,
      acquisition,
    },
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const current = Math.min(page, pages);
  const list = filtered.slice((current - 1) * 24, current * 24);
  const update = (fn: (s: string) => void, v: string) => {
    fn(v);
    setPage(1);
  };
  return (
    <main id="main" className="class-codex class-directory">
      <header className="class-intro">
        <div>
          <p className="class-label">AdventureQuest Worlds</p>
          <h1 className="codex-heading">Class Codex</h1>
        </div>
      </header>
      <section className="class-filter-panel" aria-label="Tìm và lọc Class">
        <label className="class-search">
          <Search size={20} />
          <span className="sr-only">Tìm tên Class</span>
          <input
            type="search"
            value={query}
            placeholder="Tìm Class, ví dụ ArchPaladin…"
            onChange={(e) => update(setQuery, e.target.value)}
          />
        </label>
        <div
          className="class-role-filters"
          role="group"
          aria-label="Phân loại Class"
        >
          {["all", "Newbie", "Midgame", "Lategame", "Endgame", "Calendar"].map(
            (value) => (
              <button
                key={value}
                aria-pressed={category === value}
                onClick={() => {
                  setCategory(value);
                  setDifficulty("all");
                  setPage(1);
                }}
              >
                {value === "all" ? "TẤT CẢ" : value.toUpperCase()}
              </button>
            ),
          )}
        </div>
        <div className="class-filters">
          <label>
            Vai trò
            <select
              value={role}
              onChange={(e) => update(setRole, e.target.value)}
            >
              <option value="all">Mọi vai trò</option>
              {classRoleOptions.map((r) => (
                <option key={r}>{r}</option>
              ))}
              <option value="unknown">Chưa phân loại</option>
            </select>
          </label>
          <label>
            Cách sở hữu
            <select
              value={acquisition}
              onChange={(e) => update(setAcquisition, e.target.value)}
            >
              <option value="all">Mọi hình thức</option>
              {[
                ["free", "Free"],
                ["reputation", "Reputation"],
                ["questline", "Questline"],
                ["member", "Member"],
                ["seasonal", "Seasonal"],
                ["token", "Boss / Token shop"],
                ["ac-shop", "AC / Shop"],
              ].map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
              <option value="unknown">Chưa đối chiếu</option>
            </select>
          </label>
        </div>
      </section>
      <div className="class-results" role="status">
        {filtered.length} hồ sơ phù hợp · Trang {current}/{pages}
      </div>
      {list.length ? (
        <section className="class-grid" aria-label="Danh sách Class">
          {list.map((c) => (
            <ClassCard key={c.id} profile={c} />
          ))}
        </section>
      ) : (
        <section className="class-empty">
          <h2>Chưa có Class phù hợp</h2>
          <p>Thử tên khác hoặc mở rộng bộ lọc.</p>
          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
              setRole("all");
              setDifficulty("all");
              setAcquisition("all");
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </button>
        </section>
      )}
      {pages > 1 && (
        <nav className="class-pagination" aria-label="Phân trang Class">
          <button disabled={current === 1} onClick={() => setPage(current - 1)}>
            Trang trước
          </button>
          <span>
            {current} / {pages}
          </span>
          <button
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Trang sau
          </button>
        </nav>
      )}
      <nav className="class-guide-links" aria-label="Hướng dẫn hệ thống Class">
        <a href="/class/general-class">Tổng quan Class</a>
        <a href="/class/class-mechanic">Cơ chế Class</a>
        <a href="/class/class-enhancements">Enhancement</a>
      </nav>
    </main>
  );
}

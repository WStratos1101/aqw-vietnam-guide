import {classIdentity,classIdentityLabel} from "../../lib/class-identity";
import { acquisitionSummary } from "../../lib/class-presentation.mjs";
import {
  calendarFamily,
  primaryCalendarClass,
} from "../../lib/calendar-families";
import variantData from "../../content/classes/calendar-variant-runtime.json";
import type { ClassAcquisition } from "../../types/class-acquisition";
import { AcquisitionInfo } from "./AcquisitionInfo";
import { classColors } from "../../lib/entity-colors.mjs";
import { pickOtherClasses } from "../../lib/other-classes.mjs";
import { ClassArtSelector } from "./ClassArtSelector";
import { ClassInspectionTabs } from "./ClassInspectionTabs";
import { ClassRoles } from "./ClassRoles";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft } from "lucide-react";
import type { AqwClass } from "../../types/classes";
import { classProfiles } from "../../content/classes";
import { useClassBody } from "./useClassBody";
import { ClassCard } from "./ClassDirectory";
export function ClassDetail({ profile }: { profile: AqwClass }) {
  const family = calendarFamily(profile.id);
  const defaultIdentity=classIdentity(profile.id);
  const [selectedArt,setSelectedArt]=useState<{name:string;source?:string}>({name:defaultIdentity?.officialName||profile.name});
  const routeSlug = location.pathname.split("/")[2];
  const initialVariant =
    family?.variants.find((v) => v.id === routeSlug) ??
    family?.variants.find((v) => v.classId === profile.id);
  const [selectedVariant, setSelectedVariant] = useState(initialVariant?.id);
  const variant = family?.variants.find((v) => v.id === selectedVariant);
  const variantRecord = variant
    ? variantData[variant.id as keyof typeof variantData]
    : undefined;
  const sharedProfile =
    classProfiles.find((c) => c.id === family?.primaryClassId) ?? profile;
  const selectedProfile =
    classProfiles.find((c) => c.id === variant?.classId) ?? profile;
  const { body, error, retry } = useClassBody(sharedProfile);
  const familyAcquisition = variantRecord
    ? ((variantRecord.acquisition as ClassAcquisition | null) ?? undefined)
    : body?.acquisition;
  const selectedName=variant?.name ?? selectedArt.name;
  const selectedIdentity=classIdentity(variant?.classId||profile.id,selectedName);
  const acquisition = !family && selectedArt.source && familyAcquisition
    ? {...familyAcquisition,methods:familyAcquisition.methods.filter(m=>m.source===selectedArt.source || m.variantName.replace(/\s*\([^)]*\)/g,'').toLowerCase()===selectedName.toLowerCase())}
    : familyAcquisition;
  const inspectedBody = body && {...body,acquisition,skills:body.skills.map(skill=>{
    const nameOverride=variantRecord?.skillNameOverrides.find(row=>row.skillId===skill.id);
    return nameOverride ? {...skill,name:nameOverride.name,officialName:nameOverride.name}:skill;
  })};
  const [related, setRelated] = useState<AqwClass[]>([]);
  useEffect(() => {
    setRelated(
      pickOtherClasses(
        classProfiles.filter((c) => primaryCalendarClass(c.id) === c.id),
        primaryCalendarClass(profile.id),
      ),
    );
  }, [profile.id]);
  return (
    <main
      id="main"
      className="class-codex class-detail"
      style={
        {
          "--class-accent-dark": classColors(profile).dark,
          "--class-accent-light": classColors(profile).light,
        } as CSSProperties
      }
    >
      <div className="class-back-row">
        <button
          onClick={() => {
            history.pushState(null, "", "/class");
            window.dispatchEvent(new PopStateEvent("popstate"));
            scrollTo(0, 0);
          }}
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <span>Class Codex</span>
      </div>
      <section className="class-hero">
        <div className="class-hero-copy">
          <p className="class-label">AQW Class</p>
          <h1>{selectedName}</h1>
          {selectedIdentity?.primaryAbbreviation && <span className="class-abbreviation hero-abbreviation">{selectedIdentity.primaryAbbreviation}</span>}
          <p className="class-role">
            <ClassRoles roles={profile.role} />
          </p>
          {!/(guide cộng đồng|hồ sơ Calendar|bộ kỹ năng và ghi chú|theo trang Class Wiki)/i.test(
            profile.shortDescription,
          ) && (
            <p className="class-hero-description">{profile.shortDescription}</p>
          )}
          <dl>
            <div>
              <dt>Phong cách</dt>
              <dd>
                {/Xem tác dụng|đang bổ sung|theo trang Class Wiki/i.test(
                  profile.playstyle,
                )
                  ? "Chưa xác minh"
                  : profile.playstyle}
              </dd>
            </div>
            <div>
              <dt>Progression</dt>
              <dd>
                <span className="difficulty-badge">
                  {profile.difficulty || "Newbie"}
                </span>
              </dd>
            </div>
            <div>
              <dt>Sở hữu</dt>
              <dd>
                <AcquisitionInfo
                  summary={
                    variant || selectedArt.source
                      ? acquisitionSummary(acquisition)
                      : profile.acquisitionSummary
                  }
                  acquisition={acquisition}
                />
              </dd>
            </div>
          </dl>
          {profile.strengths[0] && (
            <p className="class-hero-strength">{profile.strengths[0]}</p>
          )}
        </div>
        <div className="class-hero-portrait">
          {family && variantRecord ? (
            <div className="class-art-selector">
              <div
                className="class-art-switch"
                role="group"
                aria-label="Đổi Art"
              >
                {family.variants.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    aria-pressed={v.id === selectedVariant}
                    onClick={() => setSelectedVariant(v.id)}
                  >
                    {v.name}
                    <small aria-hidden="true">{classIdentity(v.classId,v.name)?.primaryAbbreviation}</small>
                  </button>
                ))}
              </div>
              <div className="class-art">
                <img
                  key={variantRecord.portrait.imagePath}
                  className="class-character-art"
                  src={variantRecord.portrait.imagePath}
                  alt={variant?.name}
                  width={variantRecord.portrait.width}
                  height={variantRecord.portrait.height}
                  style={{
                    maxWidth: variantRecord.portrait.width,
                    maxHeight: variantRecord.portrait.height,
                  }}
                />
              </div>
              <span className="class-art-caption">{classIdentityLabel(variant?.classId||profile.id,variant?.name)}</span>
            </div>
          ) : (
            <ClassArtSelector
              classId={profile.id}
              image={profile.image}
              name={defaultIdentity?.officialName||profile.name}
              onSelect={setSelectedArt}
            />
          )}
        </div>
      </section>
      {!inspectedBody ? (
        <section className="class-content-status" role="status">
          <p>{error || "Đang tải bộ skill và hướng dẫn Class…"}</p>
          {error && <button onClick={retry}>Thử tải lại</button>}
        </section>
      ) : (
        <>
          <ClassInspectionTabs profile={selectedProfile} body={inspectedBody} />
          {profile.weaknesses.length > 0 && (
            <aside className="class-practice-notes">
              <h2>Lưu ý khi sử dụng</h2>
              <ul>
                {profile.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </aside>
          )}
          <section className="class-section class-related">
            <h2>Các Class Khác</h2>
            {related.length > 0 && (
              <div className="class-grid">
                {related.map((c) => (
                  <ClassCard key={c.id} profile={c} />
                ))}
              </div>
            )}
            <div className="class-guide-links">
              <a href="/he-thong/enhancement">Enhancement</a>
              <a href="/ultra-boss">Ultra Boss</a>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

import { useId, useState, type CSSProperties } from "react";
import { Swords, GitBranch, ScrollText } from "lucide-react";
import type { AqwClass, ClassBody } from "../../types/classes";
import { ClassSkills } from "./ClassSkills";
import { ClassCombos } from "./ClassCombos";
import { CalendarConsumables } from "./CalendarConsumables";
import { ClassAcquisitionPanel } from "./ClassAcquisitionPanel";
import "../../styles/classes/inspection-v12-4.css";
type Tab = "skills" | "combo" | "acquisition";
const tabs = [
  { id: "skills" as Tab, label: "BỘ SKILL", short: "Kỹ năng", Icon: Swords },
  {
    id: "combo" as Tab,
    label: "HƯỚNG DẪN COMBO",
    short: "Combo",
    Icon: GitBranch,
  },
  {
    id: "acquisition" as Tab,
    label: "CÁCH LẤY CLASS",
    short: "Cách lấy",
    Icon: ScrollText,
  },
];
export function ClassInspectionTabs({
  profile,
  body,
}: {
  profile: AqwClass;
  body: ClassBody;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("skills");
  const [selectedSkillId, setSelectedSkillId] = useState<string>();
  const id = useId();
  const skills = body.skills.filter((s) => !s.quarantined);
  return (
    <section
      className="class-interactive-inspection"
      aria-label="Class Inspection"
    >
      <div
        className="class-inspection-tabs"
        role="tablist"
        aria-label="Điều hướng hồ sơ Class"
        style={
          {
            "--class-tab-index": tabs.findIndex((t) => t.id === activeTab),
          } as CSSProperties
        }
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
            return;
          e.preventDefault();
          const index = tabs.findIndex((t) => t.id === activeTab);
          const next =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? tabs.length - 1
                : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                  tabs.length;
          setActiveTab(tabs[next].id);
          e.currentTarget
            .querySelectorAll<HTMLButtonElement>("button")
            [next]?.focus();
        }}
      >
        {tabs.map(({ id: tab, label, short, Icon }) => (
          <button
            type="button"
            key={tab}
            role="tab"
            id={`${id}-${tab}-tab`}
            aria-label={label}
            aria-selected={activeTab === tab}
            aria-controls={`${id}-${tab}-panel`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
          >
            <Icon size={18} aria-hidden="true" />
            <span className="class-tab-wide">{label}</span>
            <span className="class-tab-short" aria-hidden="true">
              {short}
            </span>
          </button>
        ))}
      </div>
      <div className="class-inspection-panels">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${id}-${tab.id}-panel`}
            aria-labelledby={`${id}-${tab.id}-tab`}
            hidden={activeTab !== tab.id}
            inert={activeTab !== tab.id}
            tabIndex={0}
            className="class-inspection-panel"
            data-class-panel={tab.id}
          >
            {tab.id === "skills" ? (
              <>
                <ClassSkills
                  skills={skills}
                  selectedSkillId={selectedSkillId}
                  onSelect={setSelectedSkillId}
                />
                <CalendarConsumables classId={profile.id} />
              </>
            ) : tab.id === "combo" ? (
              <ClassCombos
                classId={profile.id}
                combos={body.combos}
                skills={skills}
                onSelectSkill={setSelectedSkillId}
              />
            ) : (
              <ClassAcquisitionPanel profile={profile} body={body} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

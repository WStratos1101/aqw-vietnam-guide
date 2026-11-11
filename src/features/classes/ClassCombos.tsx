import { selectedComboContent } from "../../lib/class-ui-v12-8.mjs";
import { comboFlow } from "../../lib/class-presentation.mjs";
import { TargetEffects } from "./TargetEffects";
import { SkillSequenceFlow, FlowLabel } from "./SkillSequenceFlow";
import { useId, useRef, useState } from "react";
import type { ClassCombo, ClassSkill } from "../../types/classes";
export function ClassCombos({
  combos,
  skills,
  onSelectSkill,
}: {
  combos: ClassCombo[];
  skills: ClassSkill[];
  onSelectSkill?: (id: string) => void;
}) {
  const [stepId, setStepId] = useState<string>();
  const [selected, setSelected] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const original = combos[selected] || combos[0];
  const active = original ? selectedComboContent(combos, original) : undefined;
  return (
    <section className="class-section" id="combo" aria-labelledby="combo-title">
      <div className="class-section-title">
        <h2 id="combo-title" tabIndex={-1}>
          Hướng dẫn combo
        </h2>
      </div>
      {active ? (
        <div className="class-combo-book" data-ui="class-codex">
          {combos.length > 1 && (
            <div
              role="tablist"
              className="class-combo-tabs"
              aria-label="Chọn combo"
              onKeyDown={(e) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
                  return;
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? combos.length - 1
                      : (selected +
                          (e.key === "ArrowRight" ? 1 : -1) +
                          combos.length) %
                        combos.length;
                setSelected(next);
                setStepId(undefined);
                refs.current[next]?.focus();
              }}
            >
              {combos.map((c, i) => (
                <button
                  key={c.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  id={`${id}-tab-${i}`}
                  role="tab"
                  aria-selected={i === selected}
                  aria-controls={`${id}-panel`}
                  tabIndex={i === selected ? 0 : -1}
                  onClick={() => {
                    setSelected(i);
                    setStepId(undefined);
                  }}
                >
                  {c.title}
                </button>
              ))}
            </div>
          )}
          <div
            className="class-combo-panel"
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={
              combos.length > 1 ? `${id}-tab-${selected}` : "combo-title"
            }
            tabIndex={0}
          >
            <div className="class-combo-reveal" key={active.id}>
              {active.verificationStatus !== "needs_review" && (
                <div className="combo-flow-groups">
                  {comboFlow(active)
                    .filter(
                      (f) =>
                        f.sequences.length > 0 ||
                        f.kind === "spam" ||
                        f.kind === "loop" ||
                        f.kind === "warning" ||
                        f.kind === "setup",
                    )
                    .map((flow) => (
                      <article
                        className={`combo-flow-group ${flow.kind}`}
                        key={flow.id}
                      >
                        <FlowLabel
                          label={flow.kind === "warning" ? "Lưu ý" : flow.label}
                          kind={flow.kind}
                        />
                        {flow.kind === "spam" && flow.stopCondition && (
                          <span className="spam-stop-condition">
                            DỪNG SPAM · {flow.stopCondition}
                          </span>
                        )}
                        {!flow.sequences.length && <p>{flow.sourceText}</p>}
                        {flow.sequences.map((sequence, i) => (
                          <div key={i}>
                            {i > 0 && <span className="combo-or">HOẶC</span>}
                            <SkillSequenceFlow
                              sequence={sequence}
                              skills={skills}
                              label={flow.label}
                              onSelect={(s) => {
                                setStepId(s.id);
                                onSelectSkill?.(s.id);
                              }}
                            />
                          </div>
                        ))}
                        <details className="combo-flow-condition">
                          <summary>Timing & điều kiện</summary>
                          <p>{flow.sourceText}</p>
                        </details>
                      </article>
                    ))}
                </div>
              )}
              {stepId && skills.find((s) => s.id === stepId) && (
                <div className="combo-step-detail">
                  <strong>{skills.find((s) => s.id === stepId)!.name}</strong>
                  <TargetEffects skill={skills.find((s) => s.id === stepId)!} />
                </div>
              )}
              {active.verificationNote && (
                <p className="ability-verification">
                  {active.verificationNote}
                </p>
              )}
              <details className="combo-source-notes">
                <summary>
                  Lưu ý & hướng dẫn đầy đủ ({active.notes.length + 1})
                </summary>
                <p>{active.explanation}</p>
                <ul>
                  {active.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>
      ) : (
        <div className="class-empty">
          <p>Combo: Chưa xác minh.</p>
        </div>
      )}
    </section>
  );
}

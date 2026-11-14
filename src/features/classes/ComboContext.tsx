import { useId, useState } from "react";
import { Clock, GitBranch } from "lucide-react";
import { comboContext } from "../../lib/combo-context.mjs";
import "../../styles/classes/combo-recovery.css";
export function ComboContext({ text }: { text: string }) {
  const id = useId(),
    [open, setOpen] = useState<Record<string, boolean>>({});
  const content = comboContext(text);
  const entries = [
    { key: "timing" as const, label: "Timing", Icon: Clock },
    { key: "conditions" as const, label: "Điều kiện", Icon: GitBranch },
  ].filter((e) => content[e.key].length);
  return (
    <div className="combo-context">
      <div className="combo-context-actions">
        {entries.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            title={label}
            aria-expanded={!!open[key]}
            aria-controls={`${id}-${key}`}
            onClick={() =>
              setOpen((current) => ({ ...current, [key]: !current[key] }))
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span className="combo-context-tooltip" role="tooltip">
              {label}
            </span>
          </button>
        ))}
      </div>
      {entries.map(({ key, label }) => (
        <div
          key={key}
          id={`${id}-${key}`}
          role="region"
          aria-label={label}
          hidden={!open[key]}
        >
          <ul>
            {content[key].map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useId, useState, type ReactNode } from "react";
import { Package, ChevronRight } from "lucide-react";
import {
  materialProgress,
  selectedMaterials,
  type MaterialNode,
  type MaterialSelections,
} from "../../lib/material-requirements.mjs";
import { readStoredValue, writeStored } from "../../lib/storage";
interface Progress {
  selections: MaterialSelections;
  done: string[];
}
function valid(value: unknown): value is Progress {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<Progress>;
  return (
    !!s.selections &&
    typeof s.selections === "object" &&
    !Array.isArray(s.selections) &&
    Object.values(s.selections).every(
      (v) => Array.isArray(v) && v.every((n) => Number.isInteger(n) && n >= 0),
    ) &&
    Array.isArray(s.done) &&
    s.done.every((n) => typeof n === "string")
  );
}
export function AcquisitionMaterials({
  tree,
  scope,
  title = "Materials",
}: {
  tree: MaterialNode;
  scope: string;
  title?: string;
}) {
  const key = "aqw:class-acquisition-materials:v12-4:" + scope,
    id = useId();
  const [state, setState] = useState<Progress>({ selections: {}, done: [] });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setState(readStoredValue(key, { selections: {}, done: [] }, valid));
    setLoaded(true);
  }, [key]);
  function update(next: Progress) {
    setState(next);
    setError(
      writeStored(key, next)
        ? ""
        : "Không lưu được tiến độ; chỉ giữ trong phiên này.",
    );
  }
  function render(node: MaterialNode, path = "root"): ReactNode {
    if (node.kind === "item") {
      const token = path + ":" + node.itemId;
      return (
        <li className="acquisition-material-row" key={path}>
          <label>
            <input
              type="checkbox"
              disabled={!loaded}
              checked={state.done.includes(token)}
              onChange={() =>
                update({
                  ...state,
                  done: state.done.includes(token)
                    ? state.done.filter((s) => s !== token)
                    : [...state.done, token],
                })
              }
            />
            <Package size={17} aria-hidden="true" />
            <span>{node.name}</span>
            <strong>×{node.quantity.toLocaleString("vi-VN")}</strong>
          </label>
          {node.source && (
            <a
              href={node.source}
              target="_blank"
              rel="noreferrer"
              aria-label={`Nguồn ${node.name}`}
            >
              <ChevronRight size={16} />
            </a>
          )}
        </li>
      );
    }
    const choices =
      state.selections[path] ||
      Array.from({ length: node.requiredChoices || 1 }, (_, i) => i);
    if (node.kind === "anyOf")
      return (
        <li className="acquisition-material-branch" key={path}>
          <fieldset>
            <legend>Chọn {node.requiredChoices || 1} phương án</legend>
            {node.requirements.map((branch, i) => (
              <div key={i}>
                <label>
                  <input
                    type={
                      (node.requiredChoices || 1) === 1 ? "radio" : "checkbox"
                    }
                    name={id + path}
                    checked={choices.includes(i)}
                    onChange={() =>
                      update({
                        ...state,
                        selections: {
                          ...state.selections,
                          [path]:
                            (node.requiredChoices || 1) === 1
                              ? [i]
                              : choices.includes(i)
                                ? choices.filter((n) => n !== i)
                                : [...choices, i].slice(
                                    -(node.requiredChoices || 1),
                                  ),
                        },
                      })
                    }
                  />
                  {branch.kind === "item" ? branch.name : `Phương án ${i + 1}`}
                </label>
                {choices.includes(i) && (
                  <ul>{render(branch, path + "." + i)}</ul>
                )}
              </div>
            ))}
          </fieldset>
        </li>
      );
    return (
      <li className="acquisition-material-group" key={path}>
        <ul>{node.requirements.map((n, i) => render(n, path + "." + i))}</ul>
      </li>
    );
  }
  const progress = materialProgress(tree, state.selections, state.done),
    total = selectedMaterials(tree, state.selections).length;
  return (
    <details className="acquisition-materials">
      <summary>
        <Package size={18} />
        <strong>{title}</strong>
        <span>
          {progress.done}/{total} mục
        </span>
      </summary>
      <div className="acquisition-material-body">
        <p>
          Đánh dấu theo phương án đang chọn; các nhánh OR chỉ yêu cầu số lựa
          chọn được ghi.
        </p>
        <ul>{render(tree)}</ul>
        {error && <p role="status">{error}</p>}
      </div>
    </details>
  );
}

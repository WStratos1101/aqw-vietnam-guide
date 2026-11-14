import { useId, useState } from "react";
import type { MaterialNode } from "../../lib/material-requirements.mjs";
import type { FarmV2Item } from "../../types/farm-v2";
import data from "../../content/farm/catalog-v2.generated.json";
import { MaterialTree } from "../ultra/MaterialTree";
const items = data.items as unknown as FarmV2Item[];
// Reuse verified action text only when it names this exact material.
function materialNotes(name: string) {
  const notes = items
    .flatMap((item) =>
      item.acquisitionRoutes.flatMap((route) => route.guidePaths || []),
    )
    .filter((path) => path.verificationStatus === "verified")
    .flatMap((path) => path.steps)
    .filter(
      (step) =>
        step.sources.length &&
        step.text
          .toLocaleLowerCase("en")
          .includes(name.toLocaleLowerCase("en")),
    );
  return [...new Map(notes.map((step) => [step.text, step])).values()];
}
export function FarmMaterials({
  tree,
  scope,
  onItemClick,
}: {
  tree: MaterialNode;
  scope: string;
  onItemClick: (id: string) => void;
}) {
  const [opened, setOpened] = useState("");
  const id = useId();
  return (
    <MaterialTree
      tree={tree}
      scope={scope}
      renderItem={(node, checkbox, image) => {
        const item = items.find(
          (i) => i.id === node.itemId || i.originalName === node.name,
        );
        const token = node.itemId + ":" + node.name;
        const notes = opened === token && !item ? materialNotes(node.name) : [];
        return (
          <div className="fv2-material-row">
            <label aria-label={"Đã có " + node.name}>{checkbox}</label>
            <details
              className="fv2-material-source"
              open={opened === token}
              onToggle={(event) => {
                if (event.currentTarget.open) setOpened(token);
                else setOpened((current) => (current === token ? "" : current));
              }}
            >
              <summary
                aria-controls={id + "-" + node.itemId}
                onClick={(event) => {
                  event.preventDefault();
                  setOpened(opened === token ? "" : token);
                }}
              >
                {image}
                <span>{node.name}</span>
                <strong>×{node.quantity.toLocaleString("vi-VN")}</strong>
              </summary>
              {opened === token && (
                <div className="fv2-material-facts" id={id + "-" + node.itemId}>
                  {item ? (
                    <>
                      {item.acquisitionRoutes.map((route) => (
                        <div key={route.id}>
                          <h4>
                            {route.method}
                            {route.location ? " · " + route.location : ""}
                          </h4>
                          <p>{route.description}</p>
                          {route.mapCommand && <code>{route.mapCommand}</code>}
                          {!!route.prerequisites?.length && (
                            <ul>
                              {route.prerequisites.map((p, n) => (
                                <li key={n}>
                                  <a href={p.source}>{p.value}</a>
                                </li>
                              ))}
                            </ul>
                          )}
                          {route.sources.map((source) => (
                            <a
                              key={source.url}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {source.label}
                            </a>
                          ))}
                        </div>
                      ))}
                      {!item.acquisitionRoutes.length && (
                        <p>
                          {item.acquisitionBrief?.text ||
                            "Chưa có cách nhận đã xác minh."}
                        </p>
                      )}
                      {!!item.prerequisites?.length && (
                        <ul>
                          {item.prerequisites.map((p, n) => (
                            <li key={n}>
                              <a href={p.source}>{p.value}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        className="fv2-linkbutton"
                        type="button"
                        onClick={() => onItemClick(item.id)}
                      >
                        Xem {item.name}
                      </button>
                    </>
                  ) : notes.length ? (
                    <>
                      {notes.map((step) => (
                        <div key={step.text}>
                          <p>{step.text}</p>
                          {step.sources.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Nguồn hướng dẫn
                            </a>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>
                      Quái drop, Quest, NPC, map và điều kiện: chưa có thông tin
                      đã xác minh trong cache.
                    </p>
                  )}
                  {node.source && (
                    <p>
                      <a
                        href={node.source}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Nguồn nguyên liệu
                      </a>
                    </p>
                  )}
                </div>
              )}
            </details>
          </div>
        );
      }}
    />
  );
}

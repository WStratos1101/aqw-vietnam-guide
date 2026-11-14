import materialGuides from "../../../content-sources/farm/material-guides.json";
import type { FarmTask } from "../../types/farm-v2";
import { useId, useState } from "react";
import type { MaterialNode } from "../../lib/material-requirements.mjs";
import type { FarmV2Item } from "../../types/farm-v2";
import data from "../../content/farm/catalog-v2.generated.json";
import { FarmRouteFacts, FarmActions } from "./FarmRouteFacts";
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
  const [routeIds, setRouteIds] = useState<Record<string, string>>({});
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
        const materialGuide =
          materialGuides[node.itemId as keyof typeof materialGuides];
        const routes = item?.acquisitionRoutes || [];
        const activeRoute =
          routes.find((r) => r.id === routeIds[token]) || routes[0];
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
                      {routes.length > 1 && (
                        <div
                          className="fv32-route-picker"
                          role="group"
                          aria-label={"Cách lấy " + node.name}
                        >
                          {routes.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              aria-pressed={r.id === activeRoute?.id}
                              onClick={() =>
                                setRouteIds((current) => ({
                                  ...current,
                                  [token]: r.id,
                                }))
                              }
                            >
                              {r.method}
                              {r.questReward
                                ? " · " + r.questReward
                                : r.location
                                  ? " · " + r.location
                                  : ""}
                            </button>
                          ))}
                        </div>
                      )}
                      {activeRoute && <FarmRouteFacts route={activeRoute} />}
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
                  ) : materialGuide ? (
                    <FarmRouteFacts
                      route={{
                        id: node.itemId,
                        regionId: null,
                        method: materialGuide.method,
                        steps: [],
                        sources: [],
                        farmTasks: materialGuide.tasks as FarmTask[],
                      }}
                    />
                  ) : notes.length ? (
                    <>
                      {notes.map((step) => (
                        <div key={step.text}>
                          <FarmActions text={step.text} />
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>
                      Quái drop, Quest, NPC, map và điều kiện: chưa có thông tin
                      đã xác minh trong cache.
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

import type { RichBlock, RichRun } from "../types/content";
import { CopyCommand } from "./Interactions";
function Runs({ runs }: { runs: RichRun[] }) {
  return (
    <>
      {runs.map((run, i) => {
        let text = <>{run.text}</>;
        if (run.bold) text = <strong>{text}</strong>;
        if (run.italic) text = <em>{text}</em>;
        if (run.sup) text = <sup>{text}</sup>;
        return run.href && !/^https?:/.test(run.href) ? (
          <a
            key={i}
            href={run.href}
            {...(/^https?:/.test(run.href)
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
          >
            {text}
          </a>
        ) : (
          <span key={i}>{text}</span>
        );
      })}
    </>
  );
}
const knownCommands = new Set([
  "/join battleon",
  "/join museum",
  "/join battleontown",
  "/who",
  "/s",
  "/p",
  "/g",
  "/r",
  "/c",
]);
export function RichContent({
  blocks,
  depth = 0,
  parentId,
  grouped = false,
}: {
  blocks: RichBlock[];
  depth?: number;
  parentId?: string;
  grouped?: boolean;
}) {
  if (depth === 0 && !grouped && parentId) {
    const groups: RichBlock[][] = [];
    for (const block of blocks) {
      const label =
        block.type !== "table"
          ? block.runs
              .map((r) => r.text)
              .join("")
              .trim()
          : "";
      if (!groups.length || /^[◆◇■]\s*/.test(label)) groups.push([]);
      groups[groups.length - 1].push(block);
    }
    if (groups.length > 1)
      return (
        <div className="guide-subtopics">
          {groups.map((group, index) => (
            <section
              className="guide-subtopic"
              key={group[0].id}
              aria-label={`Chi tiết ${index + 1}`}
            >
              <RichContent blocks={group} grouped parentId={parentId} />
            </section>
          ))}
        </div>
      );
  }
  const rendered = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "table") {
      rendered.push(
        <div
          key={block.id}
          id={block.id}
          className="source-table"
          role="region"
          aria-label="Bảng hướng dẫn"
          tabIndex={0}
        >
          <table>
            <caption className="sr-only">Bảng dữ liệu trong hướng dẫn</caption>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.cells.map((cell, ci) => (
                    <td key={ci} colSpan={cell.colSpan} rowSpan={cell.rowSpan}>
                      <RichContent blocks={cell.blocks} depth={depth + 1} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (block.listDepth !== undefined) {
      const items = [block];
      while (i + 1 < blocks.length) {
        const next = blocks[i + 1];
        if (next.type === "table" || next.listDepth === undefined) break;
        items.push(next);
        i++;
      }
      rendered.push(
        <ul className="source-list" key={block.id}>
          {items.map((item) => (
            <li
              key={item.id}
              id={item.id}
              style={{
                marginInlineStart: Math.min(item.listDepth || 0, 4) * 16,
              }}
            >
              <Runs runs={item.runs} />
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    const plain = block.runs
      .map((r) => r.text)
      .join("")
      .trim();
    if (block.type === "heading") {
      const Heading = plain.length > 140 ? "p" : "h3";
      rendered.push(
        <Heading id={block.id} key={block.id}>
          <Runs runs={block.runs} />
        </Heading>,
      );
    } else {
      rendered.push(
        <p key={block.id} id={block.id}>
          <Runs runs={block.runs} />
        </p>,
      );
      const command = knownCommands.has(plain) ? plain : plain.split(/\s+/)[0];
      if (depth === 0 && knownCommands.has(command))
        rendered.push(
          <CopyCommand key={block.id + "-copy"} command={command} />,
        );
    }
  }
  return <div className="rich-content">{rendered}</div>;
}
export function WeaponRanges() {
  return (
    <figure className="weapon-ranges">
      <figcaption>Ba dạng Weapon Range</figcaption>
      <table>
        <thead>
          <tr>
            <th>Dạng</th>
            <th>Ví dụ</th>
            <th>Cách đọc</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Stable</th>
            <td>86–106</td>
            <td>Khoảng Min và Max gần nhau.</td>
          </tr>
          <tr>
            <th>Unstable</th>
            <td>0–236</td>
            <td>Khoảng dao động lớn.</td>
          </tr>
          <tr>
            <th>Static</th>
            <td>Min = Max</td>
            <td>Hai đầu khoảng sát thương bằng nhau.</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}

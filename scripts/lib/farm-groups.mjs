// Offline group adapter. Only source paths and reviewed document headings assign groups.
export function assignFarmGroups(items, extracts, manifest) {
  const pages = new Map(extracts.pages.map((p) => [p.url, p]));
  const siteRoot = manifest.siteUrl.split("?")[0];
  const ids = new Set(manifest.groups.map((g) => g.id));
  const docSections = new Map();
  for (const page of extracts.pages.filter(
    (p) => p.sourceDocument === "google-docs",
  )) {
    let chapter = "",
      heading = "",
      groupId = null;
    docSections.set(
      page.url,
      page.text.split(/\r?\n/).map((line, index) => {
        const text = line.trim();
        if (/^[IVX]+\. /.test(text)) {
          chapter = text;
          heading = "";
          groupId =
            manifest.groups.find((g) => g.docChapter === chapter)?.id || null;
        }
        const mixed = manifest.mixedDocSections.find(
          (s) => s.chapter === chapter && s.heading === text,
        );
        if (mixed) {
          groupId = mixed.groupId;
          heading = mixed.heading;
        }
        return { groupId, chapter, heading, line: index + 1 };
      }),
    );
  }
  for (const item of items) {
    const evidence = [];
    for (const ref of item.provenance || []) {
      const page = pages.get(ref.sourceUrl);
      if (!page) continue;
      if (
        page.sourceDocument === "vncollector" &&
        page.url.startsWith(siteRoot + "/")
      ) {
        const section = page.url.slice(siteRoot.length + 1).split("/")[0];
        const group = manifest.groups.find((g) => g.siteSection === section);
        if (group)
          evidence.push({
            groupId: group.id,
            sourceUrl: page.url,
            sourceDocument: page.sourceDocument,
            heading: page.title,
            lines: ref.lines,
            status: "source-context",
            note: "Item reference in guide section; may be a prerequisite or material, not an allegiance claim.",
          });
      } else if (page.sourceDocument === "google-docs") {
        for (const line of ref.lines) {
          const section = docSections.get(page.url)?.[line - 1];
          if (!section?.groupId) continue;
          const existing = evidence.find(
            (e) =>
              e.sourceUrl === page.url &&
              e.groupId === section.groupId &&
              e.heading === (section.heading || section.chapter),
          );
          if (existing) existing.lines.push(line);
          else
            evidence.push({
              groupId: section.groupId,
              sourceUrl: page.url,
              sourceDocument: page.sourceDocument,
              chapter: section.chapter,
              heading: section.heading || section.chapter,
              lines: [line],
              status: "source-context",
            });
        }
      }
    }
    const override = manifest.overrides[item.id];
    if (override) {
      if (!override.reason || !override.evidence?.length)
        throw Error("Unreviewed group override: " + item.id);
      item.groupEvidence = override.evidence;
      item.groupIds = [...new Set(override.groupIds)];
      item.groupStatus = "manual-reviewed";
    } else {
      item.groupEvidence = evidence;
      item.groupIds = [...new Set(evidence.map((e) => e.groupId))];
      item.groupStatus = evidence.length ? "source-context" : "unknown";
    }
    // V3.2: references in a guide are provenance, not simultaneous allegiance.
    // Prefer a named item section. Ambiguous contexts stay explicitly pending.
    const normalized = (value) =>
      value
        .toLowerCase()
        .replace(/\(class\)/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
    const name = normalized(item.originalName || item.name || "");
    const scored = item.groupEvidence.map((entry) => {
      const page = pages.get(entry.sourceUrl);
      if (!page || !name || page.sourceDocument !== "vncollector")
        return { entry, score: 0 };
      const title = normalized(page.title || "")
        .replace(/^aqw vietnam collector /, "")
        .replace(/^farm /, "");
      const namesItem = (value) =>
        value === name || value.startsWith(name + " ");
      if (namesItem(title)) return { entry, score: 100 };
      const top = page.text.split(/\r?\n/).slice(0, 3).map(normalized);
      return {
        entry,
        score: namesItem(top[0] || "")
          ? 100
          : /set/.test(top[0] || "") && top.slice(1).some(namesItem)
            ? 80
            : 0,
      };
    });
    const highest = Math.max(0, ...scored.map((e) => e.score));
    const namedGroups = [
      ...new Set(
        scored
          .filter((e) => highest > 0 && e.score === highest)
          .map((e) => e.entry.groupId),
      ),
    ];
    const contexts = [...new Set(item.groupIds)];
    const primary = override
      ? contexts.length === 1
        ? contexts[0]
        : null
      : namedGroups.length === 1
        ? namedGroups[0]
        : namedGroups.length === 0 && contexts.length === 1
          ? contexts[0]
          : null;
    item.groupIds = primary ? [primary] : [];
    item.groupStatus = primary
      ? override
        ? "manual-reviewed"
        : namedGroups.length === 1
          ? "named-source-primary"
          : "source-context-primary"
      : contexts.length
        ? "pending-conflicting-contexts"
        : "unknown";
    for (const id of item.groupIds) {
      if (
        !ids.has(id) ||
        !item.groupEvidence.some((e) => e.groupId === id && e.sourceUrl)
      )
        throw Error("Invalid group evidence: " + item.id + ":" + id);
    }
  }
  return items;
}

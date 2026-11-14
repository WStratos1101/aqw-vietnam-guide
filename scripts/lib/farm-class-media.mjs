// Class artwork is reusable only for the exact Class Wiki entity. No name/slot guessing.
const canonical = (url) =>
  String(url || "")
    .replace(/^http:/, "https:")
    .split(/[?#]/)[0]
    .replace(/\/$/, "");
export function farmClassMedia(item, profiles, classSources, portraits) {
  if (item.category !== "Classes") return null;
  const matches = profiles.filter(
    (p) => canonical(classSources[p.id]?.sourceUrl) === canonical(item.wikiUrl),
  );
  if (matches.length !== 1) return null;
  const profile = matches[0];
  const portrait = portraits.find(
    (a) =>
      a.classId === profile.id &&
      a.id === profile.image &&
      canonical(a.sourceUrl) === canonical(item.wikiUrl) &&
      a.verificationStatus === "verified" &&
      a.usageStatus === "approved_noncommercial" &&
      a.policyUrl &&
      a.sha256 &&
      a.imagePath?.startsWith("/images/aqw/classes/") &&
      !a.imagePath.includes(".."),
  );
  return { classHref: "/class/" + profile.slug, portrait: portrait || null };
}

export function farmClassRoles(item, profiles, classSources, overrides = {}) {
  if (item.category !== "Classes") return null;
  const matches = profiles.filter((p) => {
    const c = classSources[p.id];
    return (
      c &&
      [c.sourceUrl, ...(c.sameSkillVariants || []).map((v) => v.url)].some(
        (url) => canonical(url) === canonical(item.wikiUrl),
      )
    );
  });
  const override = overrides[item.id];
  if (
    !matches.length &&
    override &&
    canonical(override.sourceUrl) === canonical(item.wikiUrl)
  ) {
    const profile = profiles.find((p) => p.id === override.classId);
    if (profile) matches.push(profile);
  }
  if (matches.length !== 1) return null;
  const p = matches[0],
    c = classSources[p.id];
  return {
    roles: p.role || [],
    classId: p.id,
    classHref: "/class/" + p.slug,
    sourceUrl: c.sourceUrl,
    matchedVariantUrl: item.wikiUrl,
    sourceHash: c.sourceHash,
    basis: p.roleBasis || null,
    relationshipEvidence: override
      ? {
          sourceUrl: override.sourceUrl,
          sourceTextHash: override.sourceTextHash,
          quote: override.quote,
          member: override.member,
        }
      : null,
  };
}

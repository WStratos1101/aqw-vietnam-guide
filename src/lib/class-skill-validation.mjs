export const normalizeSkillName = (s) =>
  s
    .normalize("NFKD")
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
export function validateSkillMapping(record, asset, profile, skill) {
  const errors = [];
  if (record.classId !== profile.id || record.skillId !== skill.id)
    errors.push("Class/skill identity mismatch");
  if (record.verificationStatus !== "verified") return errors;
  if (!asset || asset.id !== record.iconAssetId)
    errors.push("Missing registry asset");
  if (
    !record.evidence?.sourcePage ||
    record.evidence.sourcePage !== record.sourceUrl ||
    !record.evidence.iconUrl ||
    !record.evidence.sourceHash
  )
    errors.push("Verified mapping has no source evidence");
  if (
    normalizeSkillName(record.officialName || "") !==
    normalizeSkillName(
      record.nameCorrection?.from === record.importedName &&
        record.nameCorrection?.classId === record.classId &&
        record.nameCorrection?.skillId === record.skillId
        ? record.nameCorrection.to
        : record.importedName || "",
    )
  )
    errors.push("Official name does not match imported skill identity");
  if (asset?.usageStatus !== "approved_noncommercial" || !asset.policyUrl)
    errors.push("Asset lacks usage evidence");
  if (
    /(?:acsmall|aclarge|legend|rare|seasonal|member|staffbirthday)\.(?:png|gif)/i.test(
      record.evidence?.iconUrl || "",
    )
  )
    errors.push("Decorative tag masquerading as skill icon");
  if (record.passive !== /passive/i.test(record.skillType || ""))
    errors.push("Active/passive grouping disagrees with Wiki type");
  if (
    !asset?.imagePath?.startsWith("/images/aqw/class-skills/") ||
    asset?.imagePath.includes("..")
  )
    errors.push("Unsafe or invalid icon path");
  return errors;
}

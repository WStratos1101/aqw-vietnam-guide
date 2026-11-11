import fs from "node:fs";
import { createHash } from "node:crypto";
const reviews = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../src/content/classes/verification-recovery-v12-11.json",
      import.meta.url,
    ),
  ),
);
export function applySkillRecovery(classId, skill, record) {
  const review = reviews.find(
    (r) => r.classId === classId && r.skillId === skill.id,
  );
  if (!review) return;
  if (
    review.sourceHash !== record?.sourceHash ||
    review.officialName !== record?.officialName
  )
    throw Error(
      "V12.11 review invalidated by source change: " + classId + "/" + skill.id,
    );
  if (
    createHash("sha256")
      .update(fs.readFileSync(review.evidence.snapshotPath))
      .digest("hex") !== review.evidence.snapshotHash
  )
    throw Error("V12.11 primary source snapshot changed");
  const { normalAttackVerified, conflictId, ...fields } = review.patch;
  Object.assign(skill, fields);
  if (fields.rangeCategory)
    Object.assign(skill.statsEvidence, {
      rangeVerification: "verified_official_review",
      rangeSource: review.evidence.source,
      rangeReview: review.evidence,
    });
  if (fields.targetCount != null)
    Object.assign(skill.statsEvidence, {
      targetVerification: "verified_official_review",
      targetSource: review.evidence.source,
      targetReview: review.evidence,
    });
  if (fields.effects)
    Object.assign(skill.effectEvidence, {
      supportingSource: review.evidence.source,
      recoveryReview: review.evidence,
      normalAttackVerified: !!normalAttackVerified,
      conflictId,
      translationMethod:
        "Source-bound V12.11 reviewed translation; original Wiki evidence retained",
    });
}

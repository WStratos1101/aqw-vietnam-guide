import data from "../content/ultra/speaker-strategies.json";
import type { ClassLoadout } from "../types/team-assignments";
export interface SpeakerStep {
  stepId: string;
  order: number;
  phase: string;
  skill: string;
  taunt: string;
  zone: string;
  tauntVariant: string | null;
  zoneVariant: string | null;
  notes: string;
  sourceRow: number;
}
type SpeakerChoice = Pick<ClassLoadout, "classId" | "name" | "abbreviation">;
interface SpeakerSlot {
  id: string;
  primaryClass: SpeakerChoice;
  alternativeClasses: SpeakerChoice[];
}
export interface SpeakerStrategy {
  id: string;
  name: string;
  label: string;
  tauntCount: number;
  classSlots: SpeakerSlot[];
  rotationSteps: SpeakerStep[];
  specialNotes: string[];
  source: string;
  sourceTableId: string;
  sourceTableHash: string;
  verificationStatus: string;
}
export const speakerStrategies = data as SpeakerStrategy[];
export function rotationPages(steps: SpeakerStep[]) {
  const pages = [{ label: "Mở đầu", steps: steps.slice(0, 2) }];
  for (let i = 2; i < steps.length; i += 4)
    pages.push({
      label: `${String(i + 1).padStart(2, "0")}–${String(Math.min(i + 4, steps.length)).padStart(2, "0")}`,
      steps: steps.slice(i, i + 4),
    });
  return pages;
}
export function selectedSpeakerClass(
  slot: SpeakerSlot,
  selected: Record<string, string>,
): SpeakerChoice {
  return (
    [slot.primaryClass, ...slot.alternativeClasses].find(
      (c) => c.classId === selected[slot.id],
    ) || slot.primaryClass
  );
}
export function speakerAssignment(
  raw: string,
  strategy: SpeakerStrategy,
  selected: Record<string, string>,
) {
  if (raw === "—") return { label: raw, tip: "" };
  const allowed = raw
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split("/")
    .map((s) => s.trim());
  const slot = raw.startsWith("mDPS")
    ? strategy.classSlots[0]
    : strategy.classSlots.find((s) =>
        [s.primaryClass, ...s.alternativeClasses].some((c) =>
          allowed.includes(c.abbreviation),
        ),
      );
  if (!slot)
    return { label: raw, tip: "Giữ đúng phân công được ghi trong bảng." };
  const choice = selectedSpeakerClass(slot, selected);
  const suffix = raw.match(/\([^)]+\)/)?.[0] || "";
  const equivalent =
    raw.startsWith("mDPS") || allowed.includes(choice.abbreviation);
  const tip = /Prax/.test(suffix)
    ? "Canh Praxis để chặn sát thương; không đổi thời điểm đã phân công."
    : suffix === "(3)"
      ? "CAv dùng skill 3 để Taunt tại lượt này."
      : suffix === "(4)"
        ? "LP dùng skill 4, cần Spirits từ skill 3; canh đúng lượt."
        : equivalent
          ? choice.name
          : `Bảng chỉ xác minh ${raw}; chưa có biến thể riêng cho ${choice.abbreviation}. Không tự đổi người nhận lượt.`;
  return {
    label: equivalent
      ? choice.abbreviation + (suffix ? " " + suffix : "")
      : raw,
    tip,
  };
}

import type { ClassAcquisitionMethod } from "../types/class-acquisition";
import { normalizeCalendarMethods } from "./calendar-acquisition.mjs";

export function presentedCalendarMethods(classId: string, methods: ClassAcquisitionMethod[]): ClassAcquisitionMethod[] {
  if (!classId.startsWith("calendar-")) return methods;
  return normalizeCalendarMethods(methods);
}

export function acquisitionTabLabel(method: ClassAcquisitionMethod): string {
  if (!method.classId.startsWith("calendar-")) return method.type.toUpperCase();
  if (method.merge) {
    const points = method.merge.materials?.kind === "allOf"
      ? method.merge.materials.requirements.find((item) => item.kind === "item" && /^heropoints?$/i.test(item.name)) : undefined;
    return `MERGE${points?.kind === "item" ? ` · ${points.quantity} HeroPoints` : ""} · ${method.merge.mergeShop}`;
  }
  if (method.shop) {
    const { amount, currency } = method.shop.price;
    const gate = method.prerequisites.map((text) => text
      .replace(/^Must have purchased (?:the )?/i, "")
      .replace(/^Must have /i, "")
      .replace(/ (?:in your inventory|from HeroMart).*$/i, ""));
    return `${amount.toLocaleString("en-US")} ${currency === "AC" ? "ACs" : currency} · ${method.shop.shopName}${gate.length ? ` · Yêu cầu: ${gate.join("; ")}` : ""}`;
  }
  return method.type.toUpperCase();
}

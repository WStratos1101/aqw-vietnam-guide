import families from "../content/classes/calendar-families.json";

export function calendarFamily(classId: string) {
  return families.find((family) =>
    family.variants.some((variant) => variant.classId === classId),
  );
}

export function primaryCalendarClass(classId: string) {
  return calendarFamily(classId)?.primaryClassId ?? classId;
}

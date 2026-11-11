import { ClassDetail } from "./ClassDetail";
import { findClass } from "../../content/classes";
import type { RouteViewProps } from "../route-views";
export function Detail({ slug }: RouteViewProps) {
  const profile = slug && findClass(slug);
  return profile ? <ClassDetail key={profile.id} profile={profile} /> : null;
}

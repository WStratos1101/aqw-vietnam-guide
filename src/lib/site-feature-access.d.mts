export const siteFeatureAccess: Readonly<
  Record<string, { prefix: string; status: "comingSoon" | "enabled" }>
>;
export function isComingSoon(path: string): boolean;

export function comingSoonRoute(path: string): string | undefined;

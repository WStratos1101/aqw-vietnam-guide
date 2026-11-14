import type { CSSProperties } from "react";
// Interface accents, not claims about official faction colors.
const palettes: Record<string, [string, string]> = {
  all: ["#e0bc70", "#795612"],
  awe: ["#e8c16b", "#79530c"],
  good: ["#8dc8f1", "#24618b"],
  chaos: ["#c6a0ed", "#784299"],
  evil: ["#f09c9c", "#9e3535"],
  blacksmithing: ["#dbb08b", "#86501f"],
  legion: ["#76cdda", "#176c7a"],
  nation: ["#e99186", "#9c3f32"],
  diablo: ["#eda16f", "#91491d"],
  hollowborn: ["#bdaceb", "#6b4c9e"],
  crystallis: ["#83daca", "#236f64"],
  "darkons-debris": ["#f09ab4", "#983d5b"],
  dragonkin: ["#d4b17e", "#80571f"],
  elemental: ["#8ed4a4", "#326d43"],
  astravian: ["#a6bbf1", "#4c5f9a"],
  other: ["#c3c5bc", "#60634e"],
  unknown: ["#b5bec9", "#535e6a"],
};
export function factionTokens(group: string): CSSProperties {
  const [dark, light] = palettes[group] || palettes.all;
  return {
    "--fv2-accent-dark": dark,
    "--fv2-accent-light": light,
  } as CSSProperties;
}

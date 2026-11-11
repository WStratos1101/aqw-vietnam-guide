import type { Entry } from "../../types/content";
export interface EntityMedia {
  name: string;
  assetId?: string;
  kind: "boss" | "item";
  wikiPage: string;
  level?: number;
  hp?: string;
}
// Identity/provenance only. Images resolve exclusively through the shared local asset renderer.
export const entityMedia: Record<string, EntityMedia> = {
  "dage-the-dark-lord": {
    name: "Dage the Dark Lord",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/dage-the-dark-lord",
    level: 100,
    hp: "6.500.000",
    assetId: "ultra-dage-portrait",
  },
  "champion-drakath": {
    name: "Champion Drakath",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/champion-drakath",
    level: 100,
    hp: "20.000.000",
  },
  "ultra-avatar-tyndarius": {
    name: "Ultra Avatar Tyndarius",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/ultra-avatar-tyndarius",
    level: 100,
    hp: "6.000.000",
    assetId: "ultra-tyndarius-portrait",
  },
  "nulgath-the-archfiend": {
    name: "Nulgath the Archfiend",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/nulgath-the-archfiend",
    assetId: "ultra-nulgath-portrait",
  },
  "malgor-the-first-speaker": {
    name: "Malgor The First Speaker",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/malgor-the-first-speaker",
    assetId: "ultra-speaker-portrait",
  },
  "king-drago": {
    name: "King Drago",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/king-drago",
    assetId: "ultra-drago-portrait",
  },
  "darkon-the-conductor": {
    name: "Darkon the Conductor",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/darkon-the-conductor",
  },
  "nightmare-carnax": {
    name: "Nightmare Carnax",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/nightmare-carnax",
  },
  "queen-iona": {
    name: "Queen Iona",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/queen-iona",
    level: 80,
    hp: "1.000.000",
  },
  "training-golem": {
    name: "Training Golem",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/training-golem",
    level: 255,
    hp: "600.000",
  },
  "astral-empyrean": {
    name: "Astral Empyrean",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/astral-empyrean",
    level: 100,
    hp: "28.000.000",
  },
  "god-of-the-depths": {
    name: "God of the Depths",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/god-of-the-depths",
    level: 95,
    hp: "40.000.000",
  },
  "kolr-usurper-of-flames": {
    name: "Kolr, Usurper of Flames",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/kolr-usurper-of-flames",
    level: 90,
    hp: "3.000.000",
  },
  "gramiel-the-graceful": {
    name: "Gramiel the Graceful",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/gramiel-the-graceful",
    level: 95,
    hp: "7.500.000",
  },
  "azalith-morningstar": {
    name: "Azalith Morningstar",
    kind: "boss",
    wikiPage: "https://aqwwiki.wikidot.com/azalith-morningstar",
    level: 200,
    hp: "888.888.888",
  },
  "blade-of-awe": {
    name: "Blade of Awe",
    kind: "item",
    wikiPage: "https://aqwwiki.wikidot.com/blade-of-awe",
  },
  "blinding-light-of-destiny-blod": {
    name: "Blinding Light of Destiny",
    kind: "item",
    wikiPage: "https://aqwwiki.wikidot.com/blinding-light-of-destiny-axe",
  },
  "necrotic-sword-of-doom-nsod": {
    name: "Necrotic Sword of Doom",
    kind: "item",
    wikiPage: "https://aqwwiki.wikidot.com/necrotic-sword-of-doom-sword",
  },
  "exalted-apotheosis": {
    name: "Exalted Apotheosis",
    kind: "item",
    wikiPage: "https://aqwwiki.wikidot.com/exalted-apotheosis",
    assetId: "item-apotheosis",
  },
};
export function mediaFor(entry: Entry) {
  return entityMedia[entry.imported?.slug || entry.slug];
}

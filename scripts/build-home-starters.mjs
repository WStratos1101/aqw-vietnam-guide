import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const catalog = read("src/content/classes/catalog.json"),
  portraits = read("src/content/classes/portrait-registry.json");
const artVariants = read("src/content/classes/art-variants.json");
const settings = [
  [
    "Warrior",
    "warrior-beast-warrior-pumpkin-lord-warlord",
    "Cận chiến, sử dụng đòn đánh vật lý.",
  ],
  ["Mage", "mage-sorcerer", "Tấn công phép và kiểm soát nhiều kẻ địch."],
  ["Healer", "healer-acolyte-witch", "Hồi phục và hỗ trợ đồng đội."],
  [
    "Rogue",
    "rogue-renegade",
    "Chiến đấu bằng Dodge và sát thương theo thời gian.",
  ],
];
const enhancements = {
  Warrior: "Fighter",
  Mage: "Wizard",
  Healer: "Healer",
  Rogue: "Thief",
};
const items = settings.map(([name, id, summary]) => {
  const profile = catalog.find((c) => c.id === id);
  const portrait = name === "Warrior"
    ? artVariants.find(art => art.classId === id && art.linkedClassId === "warrior-class" && art.variantName === "Warrior · Male")
    : portraits.find(p => p.id === profile.image);
  if (!portrait || portrait.verificationStatus !== "verified")
    throw Error("Missing starter portrait: " + id);
  return {
    name,
    classId: id,
    slug: profile.slug,
    role: profile.role,
    summary,
    enhancement: enhancements[name],
    portrait,
    source: portrait.source || portrait.sourceUrl,
  };
});
fs.writeFileSync(
  "src/content/home-starters.json",
  JSON.stringify(items, null, 2) + "\n",
);

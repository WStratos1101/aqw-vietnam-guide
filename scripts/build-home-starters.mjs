import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const catalog = read("src/content/classes/catalog.json"),
  portraits = read("src/content/classes/portrait-registry.json");
const artVariants = read("src/content/classes/art-variants.json");
const settings = [
  [
    "Warrior",
    "warrior-beast-warrior-pumpkin-lord-warlord",
    "Trên những con đường dẫn ra khỏi Battleon, một thanh kiếm và lòng quả cảm đôi khi là tất cả những gì người chiến binh có. Warrior bước vào nơi hiểm nguy ập tới đầu tiên, dùng thép và ý chí để mở đường cho đồng đội.",
    [
      "DPS",
      "Tank"
    ],
    "Áp sát mục tiêu, phá phòng thủ, làm choáng và chống chịu đòn đánh.",
    "Vật lý"
  ],
  [
    "Mage",
    "mage-sorcerer",
    "Trong thế giới Lore, ngay cả một ngọn lửa nhỏ cũng có thể cất giấu quyền năng của cả một cơn bão. Mage theo đuổi tri thức về các nguyên tố, biến những bí thuật học được thành sức mạnh làm chủ chiến trường.",
    [
      "DPS",
      "Support"
    ],
    "Phóng phép nguyên tố, gây sát thương diện rộng, làm suy yếu đối thủ và bảo vệ bản thân.",
    "Phép thuật"
  ],
  [
    "Healer",
    "healer-acolyte-witch",
    "Không phải mọi anh hùng đều bước vào trận chiến với khát vọng tiêu diệt kẻ thù. Healer mang theo sức mạnh chữa lành, giữ ngọn lửa hy vọng còn cháy khi những người đồng hành đã đứng bên bờ vực thất bại.",
    [
      "Support",
      "Heal"
    ],
    "Hồi máu, duy trì sinh lực và mana, làm suy yếu kẻ địch bằng phép thuật.",
    "Phép thuật"
  ],
  [
    "Rogue",
    "rogue-renegade",
    "Giữa những con hẻm tối và lối mòn bí mật của Lore, Rogue học cách sống sót bằng sự nhanh nhẹn thay vì sức mạnh thuần túy. Một nhát dao đúng thời điểm và một bước chân khỏi tầm nhìn có thể xoay chuyển cả một cuộc giao tranh.",
    [
      "DPS",
      "Dodge"
    ],
    "Né tránh, duy trì độc tố và dồn sát thương khi đối thủ sơ hở.",
    "Vật lý"
  ]
];
const enhancements = {
  Warrior: "Fighter",
  Mage: "Wizard",
  Healer: "Healer",
  Rogue: "Thief",
};
const items = settings.map(([name, id, summary, role, playstyle, damageType]) => {
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
    role,
    summary,
    playstyle,
    damageType,
    enhancement: enhancements[name],
    portrait,
    source: portrait.source || portrait.sourceUrl,
  };
});
fs.writeFileSync(
  "src/content/home-starters.json",
  JSON.stringify(items, null, 2) + "\n",
);

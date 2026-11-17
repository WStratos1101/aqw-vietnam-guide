// Original editorial flavor text. Coordinates are measured from the 742x444 official in-game screenshot.
export interface LoreRegion { slug:string; name:string; description:string; x:number|null; y:number|null }
export const loreRegions: readonly LoreRegion[] = [
  {
    "slug": "battleon",
    "name": "Battleon",
    "description": "Nơi những kẻ vô danh bước qua cánh cổng và bắt đầu viết nên huyền thoại.",
    "x": null,
    "y": null
  },
  {
    "slug": "greenguard",
    "name": "Greenguard",
    "description": "Sau những lối mòn xanh thẳm là hiểm nguy đầu tiên dành cho người mới cầm kiếm.",
    "x": 50.53908,
    "y": 57.43243
  },
  {
    "slug": "swordhaven",
    "name": "Swordhaven",
    "description": "Giữa thành lũy và cờ hiệu của Good, danh dự được đem ra thử thách.",
    "x": null,
    "y": null
  },
  {
    "slug": "shadowfall",
    "name": "Shadowfall",
    "description": "Bên dưới bóng cờ Shadowscythe, lòng trung thành có một cái giá riêng.",
    "x": null,
    "y": null
  },
  {
    "slug": "darkovia",
    "name": "Darkovia",
    "description": "Khi trăng lên, những câu chuyện về ma cà rồng và người sói không còn là lời đồn.",
    "x": 56.87332,
    "y": 50.22523
  },
  {
    "slug": "dwarfhold",
    "name": "Dwarfhold",
    "description": "Trong lòng núi, tiếng búa vang vọng qua những hành lang cất giữ bí mật cổ xưa.",
    "x": 64.69003,
    "y": 39.86486
  },
  {
    "slug": "yokai-isle",
    "name": "Yokai Isle",
    "description": "Vượt biển đến xứ sở của yêu quái, kiếm sĩ và những truyền thuyết chưa ngủ yên.",
    "x": 75.87601,
    "y": 56.30631
  },
  {
    "slug": "sandsea",
    "name": "Sandsea",
    "description": "Gió cát vùi lấp di tích và kho báu, nhưng không thể chôn vùi những lời nguyền.",
    "x": 41.91375,
    "y": 73.64865
  },
  {
    "slug": "arcangrove",
    "name": "Arcangrove",
    "description": "Trong miền đất thấm đẫm ma lực, tri thức cũng nguy hiểm như những cổ vật bị phong ấn.",
    "x": 46.36119,
    "y": 44.59459
  },
  {
    "slug": "doomwood",
    "name": "Doomwood",
    "description": "Nơi bóng tối và cái chết thử thách ý chí của những kẻ còn sống.",
    "x": 44.74394,
    "y": 53.37838
  },
  {
    "slug": "chiral-valley",
    "name": "Chiral Valley",
    "description": "Những vết rạn của Chaos mở đầu cho một cuộc đối đầu vượt xa mọi toan tính.",
    "x": 43.39623,
    "y": 64.86486
  },
  {
    "slug": "mythsong",
    "name": "Mythsong",
    "description": "Tại đây, âm nhạc có sức mạnh riêng và mỗi giai điệu đều có thể trở thành một trận chiến.",
    "x": 52.29111,
    "y": 40.31532
  },
  {
    "slug": "bloodtusk",
    "name": "Bloodtusk",
    "description": "Giữa những vách đá, số phận của Horcs và Trolls đan vào một cuộc xung đột.",
    "x": 57.4124,
    "y": 59.68468
  },
  {
    "slug": "thunderforge",
    "name": "Thunderforge",
    "description": "Sấm rền trên vùng đất nơi những bí mật tăm tối chờ được khai mở.",
    "x": 39.08356,
    "y": 44.59459
  },
  {
    "slug": "frozen-northlands",
    "name": "Frozen Northlands",
    "description": "Giữa tuyết trắng và những ngọn núi lạnh giá, cuộc phiêu lưu vẫn không ngừng.",
    "x": 59.97305,
    "y": 9.45946
  },
  {
    "slug": "throne-of-darkness",
    "name": "Throne of Darkness",
    "description": "Những quyền lực bí ẩn tụ hội phía sau một câu chuyện đầy nguy hiểm.",
    "x": 23.98922,
    "y": 25.45045
  },
  {
    "slug": "chaos",
    "name": "Chaos",
    "description": "Theo dấu sức mạnh Chaos và những biến cố làm thay đổi Lore.",
    "x": 46.09164,
    "y": 31.30631
  },
  {
    "slug": "xans-lab",
    "name": "Xan's Lab",
    "description": "Ngọn lửa không bao giờ tắt ở nơi những thí nghiệm nguy hiểm chờ đợi.",
    "x": 13.74663,
    "y": 45.72072
  },
  {
    "slug": "mirror-realm",
    "name": "Mirror Realm",
    "description": "Một thế giới phản chiếu, nơi những điều tưởng chừng quen thuộc trở nên xa lạ.",
    "x": 27.49326,
    "y": 45.72072
  },
  {
    "slug": "skullholme",
    "name": "Skullholme",
    "description": "Những bước chân dẫn vào vùng đất phủ bóng của tử thần.",
    "x": 36.92722,
    "y": 55.40541
  },
  {
    "slug": "oaklore-forest",
    "name": "Oaklore Forest",
    "description": "Những lối mòn và cuộc phiêu lưu đầu tiên đang chờ ở Oaklore.",
    "x": 64.01617,
    "y": 61.26126
  },
  {
    "slug": "chronospan",
    "name": "ChronoSpan",
    "description": "Thời gian và những dòng lịch sử giao nhau trong vùng đất kỳ lạ này.",
    "x": 35.04043,
    "y": 64.41441
  },
  {
    "slug": "etherstorm-wastes",
    "name": "Etherstorm Wastes",
    "description": "Băng qua vùng hoang địa nơi sức mạnh nguyên tố không ngừng biến chuyển.",
    "x": 50.9434,
    "y": 68.24324
  },
  {
    "slug": "dage-the-evil",
    "name": "Dage the Evil",
    "description": "Theo dấu Undead Legion và quyền lực của Dage the Evil.",
    "x": 74.93261,
    "y": 72.74775
  },
  {
    "slug": "skull-punch",
    "name": "Skull Punch",
    "description": "Một hòn đảo với những bí ẩn chờ người phiêu lưu khám phá.",
    "x": 54.85175,
    "y": 83.10811
  },
  {
    "slug": "northpointe-island",
    "name": "Northpointe Island",
    "description": "Ngoài khơi Lore, một hòn đảo hứa hẹn những cuộc phiêu lưu mới.",
    "x": 64.69003,
    "y": 92.56757
  },
  {
    "slug": "fire-islands",
    "name": "Fire Islands",
    "description": "Những đảo lửa ở rìa biển, nơi hiểm nguy dâng lên cùng sức nóng.",
    "x": 80.86253,
    "y": 89.86486
  }
];
export const loreRegionHref = (region:LoreRegion) => "/cot-truyen/"+region.slug;
export function findLoreRegion(path:string) {
  return loreRegions.find(region => loreRegionHref(region) === path.replace(/\/$/,""));
}

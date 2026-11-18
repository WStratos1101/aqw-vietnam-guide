// Original editorial flavor text. Coordinates are measured from the 2048x1230 official in-game screenshot.
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
    "x": 50.09766,
    "y": 51.21951
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
    "x": 56.54297,
    "y": 43.90244
  },
  {
    "slug": "dwarfhold",
    "name": "Dwarfhold",
    "description": "Trong lòng núi, tiếng búa vang vọng qua những hành lang cất giữ bí mật cổ xưa.",
    "x": 64.50195,
    "y": 33.57724
  },
  {
    "slug": "yokai-isle",
    "name": "Yokai Isle",
    "description": "Vượt biển đến xứ sở của yêu quái, kiếm sĩ và những truyền thuyết chưa ngủ yên.",
    "x": 75.92773,
    "y": 50.0813
  },
  {
    "slug": "sandsea",
    "name": "Sandsea",
    "description": "Gió cát vùi lấp di tích và kho báu, nhưng không thể chôn vùi những lời nguyền.",
    "x": 41.40625,
    "y": 67.56098
  },
  {
    "slug": "arcangrove",
    "name": "Arcangrove",
    "description": "Trong miền đất thấm đẫm ma lực, tri thức cũng nguy hiểm như những cổ vật bị phong ấn.",
    "x": 45.94727,
    "y": 38.21138
  },
  {
    "slug": "doomwood",
    "name": "Doomwood",
    "description": "Nơi bóng tối và cái chết thử thách ý chí của những kẻ còn sống.",
    "x": 44.18945,
    "y": 46.74797
  },
  {
    "slug": "chiral-valley",
    "name": "Chiral Valley",
    "description": "Những vết rạn của Chaos mở đầu cho một cuộc đối đầu vượt xa mọi toan tính.",
    "x": 42.91992,
    "y": 58.69919
  },
  {
    "slug": "mythsong",
    "name": "Mythsong",
    "description": "Tại đây, âm nhạc có sức mạnh riêng và mỗi giai điệu đều có thể trở thành một trận chiến.",
    "x": 51.9043,
    "y": 33.73984
  },
  {
    "slug": "bloodtusk",
    "name": "Bloodtusk",
    "description": "Giữa những vách đá, số phận của Horcs và Trolls đan vào một cuộc xung đột.",
    "x": 57.17773,
    "y": 53.17073
  },
  {
    "slug": "thunderforge",
    "name": "Thunderforge",
    "description": "Sấm rền trên vùng đất nơi những bí mật tăm tối chờ được khai mở.",
    "x": 38.47656,
    "y": 38.13008
  },
  {
    "slug": "frozen-northlands",
    "name": "Frozen Northlands",
    "description": "Giữa tuyết trắng và những ngọn núi lạnh giá, cuộc phiêu lưu vẫn không ngừng.",
    "x": 59.86328,
    "y": 2.27642
  },
  {
    "slug": "throne-of-darkness",
    "name": "Throne of Darkness",
    "description": "Những quyền lực bí ẩn tụ hội phía sau một câu chuyện đầy nguy hiểm.",
    "x": 23.19336,
    "y": 18.61789
  },
  {
    "slug": "chaos",
    "name": "Chaos",
    "description": "Theo dấu sức mạnh Chaos và những biến cố làm thay đổi Lore.",
    "x": 45.70312,
    "y": 25.12195
  },
  {
    "slug": "xans-lab",
    "name": "Xan's Lair",
    "description": "Ngọn lửa không bao giờ tắt ở nơi những thí nghiệm nguy hiểm chờ đợi.",
    "x": 12.79297,
    "y": 39.5935
  },
  {
    "slug": "mirror-realm",
    "name": "Mirror Realm",
    "description": "Một thế giới phản chiếu, nơi những điều tưởng chừng quen thuộc trở nên xa lạ.",
    "x": 26.85547,
    "y": 39.26829
  },
  {
    "slug": "skullholme",
    "name": "Skullholme",
    "description": "Những bước chân dẫn vào vùng đất phủ bóng của tử thần.",
    "x": 36.2793,
    "y": 48.86179
  },
  {
    "slug": "oaklore-forest",
    "name": "Oaklore Forest",
    "description": "Những lối mòn và cuộc phiêu lưu đầu tiên đang chờ ở Oaklore.",
    "x": 63.96484,
    "y": 55.12195
  },
  {
    "slug": "chronospan",
    "name": "ChronoSpan",
    "description": "Thời gian và những dòng lịch sử giao nhau trong vùng đất kỳ lạ này.",
    "x": 34.47266,
    "y": 57.88618
  },
  {
    "slug": "etherstorm-wastes",
    "name": "Etherstorm Wastes",
    "description": "Băng qua vùng hoang địa nơi sức mạnh nguyên tố không ngừng biến chuyển.",
    "x": 50.63477,
    "y": 61.86992
  },
  {
    "slug": "dage-the-evil",
    "name": "Dage the Evil",
    "description": "Theo dấu Undead Legion và quyền lực của Dage the Evil.",
    "x": 75.04883,
    "y": 66.58537
  },
  {
    "slug": "skull-punch",
    "name": "Skull Punch",
    "description": "Một hòn đảo với những bí ẩn chờ người phiêu lưu khám phá.",
    "x": 54.58984,
    "y": 76.91057
  },
  {
    "slug": "northpointe-island",
    "name": "Northpointe Island",
    "description": "Ngoài khơi Lore, một hòn đảo hứa hẹn những cuộc phiêu lưu mới.",
    "x": 64.59961,
    "y": 86.91057
  },
  {
    "slug": "fire-islands",
    "name": "Fire Islands",
    "description": "Những đảo lửa ở rìa biển, nơi hiểm nguy dâng lên cùng sức nóng.",
    "x": 81.00586,
    "y": 84.14634
  }
];
export const loreRegionHref = (region:LoreRegion) => "/cot-truyen/"+region.slug;
export function findLoreRegion(path:string) {
  return loreRegions.find(region => loreRegionHref(region) === path.replace(/\/$/,""));
}

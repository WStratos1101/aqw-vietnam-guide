// Original editorial flavor text. Coordinates are schematic.
export interface LoreRegion { slug:string; name:string; description:string; x:number; y:number }
export const loreRegions: readonly LoreRegion[] = [
  {
    "slug": "battleon",
    "name": "Battleon",
    "description": "Nơi những kẻ vô danh bước qua cánh cổng và bắt đầu viết nên huyền thoại.",
    "x": 49,
    "y": 47
  },
  {
    "slug": "greenguard",
    "name": "Greenguard",
    "description": "Sau những lối mòn xanh thẳm là hiểm nguy đầu tiên dành cho người mới cầm kiếm.",
    "x": 38,
    "y": 61
  },
  {
    "slug": "swordhaven",
    "name": "Swordhaven",
    "description": "Giữa thành lũy và cờ hiệu của Good, danh dự được đem ra thử thách.",
    "x": 28,
    "y": 44
  },
  {
    "slug": "shadowfall",
    "name": "Shadowfall",
    "description": "Bên dưới bóng cờ Shadowscythe, lòng trung thành có một cái giá riêng.",
    "x": 72,
    "y": 45
  },
  {
    "slug": "darkovia",
    "name": "Darkovia",
    "description": "Khi trăng lên, những câu chuyện về ma cà rồng và người sói không còn là lời đồn.",
    "x": 76,
    "y": 21
  },
  {
    "slug": "dwarfhold",
    "name": "Dwarfhold",
    "description": "Trong lòng núi, tiếng búa vang vọng qua những hành lang cất giữ bí mật cổ xưa.",
    "x": 20,
    "y": 22
  },
  {
    "slug": "yokai-isle",
    "name": "Yokai Isle",
    "description": "Vượt biển đến xứ sở của yêu quái, kiếm sĩ và những truyền thuyết chưa ngủ yên.",
    "x": 88,
    "y": 78
  },
  {
    "slug": "sandsea",
    "name": "Sandsea",
    "description": "Gió cát vùi lấp di tích và kho báu, nhưng không thể chôn vùi những lời nguyền.",
    "x": 16,
    "y": 80
  },
  {
    "slug": "arcangrove",
    "name": "Arcangrove",
    "description": "Trong miền đất thấm đẫm ma lực, tri thức cũng nguy hiểm như những cổ vật bị phong ấn.",
    "x": 43,
    "y": 18
  },
  {
    "slug": "doomwood",
    "name": "Doomwood",
    "description": "Nơi bóng tối và cái chết thử thách ý chí của những kẻ còn sống.",
    "x": 61,
    "y": 76
  },
  {
    "slug": "chiral-valley",
    "name": "Chiral Valley",
    "description": "Những vết rạn của Chaos mở đầu cho một cuộc đối đầu vượt xa mọi toan tính.",
    "x": 34,
    "y": 33
  },
  {
    "slug": "mythsong",
    "name": "Mythsong",
    "description": "Tại đây, âm nhạc có sức mạnh riêng và mỗi giai điệu đều có thể trở thành một trận chiến.",
    "x": 57,
    "y": 32
  },
  {
    "slug": "bloodtusk",
    "name": "Bloodtusk",
    "description": "Giữa những vách đá, số phận của Horcs và Trolls đan vào một cuộc xung đột.",
    "x": 24,
    "y": 64
  },
  {
    "slug": "thunderforge",
    "name": "Thunderforge",
    "description": "Sấm rền trên vùng đất nơi những bí mật tăm tối chờ được khai mở.",
    "x": 82,
    "y": 59
  }
];
export const loreRegionHref = (region:LoreRegion) => "/cot-truyen/"+region.slug;
export function findLoreRegion(path:string) {
  return loreRegions.find(region => loreRegionHref(region) === path.replace(/\/$/,""));
}

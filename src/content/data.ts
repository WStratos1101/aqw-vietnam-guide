import { communityGuides } from "./community";
import { systemGuides } from "./systems";
import type {
  Entry,
  Source,
  GameClass,
  FarmingGuide,
  Item,
} from "../types/content";
const date = "2026-11-05";
const wiki = (path: string, title: string): Source => ({
  title,
  url: `https://aqwwiki.wikidot.com/${path}`,
  checkedAt: date,
  kind: "community",
});
const base = {
  difficulty: "Dễ" as const,
  status: "Đã đối chiếu" as const,
  updatedAt: date,
  readMinutes: 3,
  related: ["bat-dau", "enhancement"],
};
export const classes: GameClass[] = [
  {
    ...base,
    category: "class",
    slug: "warrior",
    title: "Warrior",
    summary:
      "Cận chiến, đơn giản và trực diện. Một điểm bắt đầu để làm quen nhịp chiến đấu.",
    role: "Cận chiến",
    ownership: "Miễn phí",
    enhancement: "Fighter",
    strengths: "Bộ kỹ năng cận chiến rõ ràng, phù hợp làm quen thao tác.",
    weaknesses: "Không nên mặc định đây là lựa chọn cho mọi trận boss.",
    sources: [wiki("warrior-class", "Warrior (Class) — AQWorlds Wiki")],
    sections: [
      {
        id: "tong-quan",
        title: "Tổng quan",
        paragraphs: [
          "Warrior dùng mô hình Tank Melee. Wiki khuyến nghị Enhancement Fighter; đây là gợi ý nền tảng, không phải build endgame tối ưu cho mọi tình huống.",
        ],
      },
      {
        id: "so-huu",
        title: "Cách sở hữu",
        paragraphs: [
          "Warrior là một Class khởi đầu. Hãy kiểm tra các cửa hàng và điều kiện trên trang nguồn khi muốn lấy lại Class.",
        ],
      },
      {
        id: "su-dung",
        title: "Cách tiếp cận",
        paragraphs: [
          "Gợi ý biên tập: làm quen từng kỹ năng trên mục tiêu thường trước khi đánh boss. Theo dõi máu và mana thay vì chỉ bấm phím liên tục.",
        ],
        note: "Rotation tối ưu chưa được kiểm chứng qua thực chiến trong phiên bản này. Không công bố chuỗi phím giả định.",
      },
    ],
  },
  {
    ...base,
    category: "class",
    slug: "mage",
    title: "Mage",
    summary:
      "Phép thuật đa mục tiêu. Tìm hiểu tương tác kỹ năng trước khi chọn một vòng đánh.",
    role: "Phép thuật",
    ownership: "Miễn phí",
    enhancement: "Wizard",
    strengths: "Có kỹ năng tác động nhiều mục tiêu.",
    weaknesses: "Cần chú ý tương tác hiệu ứng giữa các kỹ năng.",
    sources: [wiki("mage", "Mage — AQWorlds Wiki")],
    sections: [
      {
        id: "tong-quan",
        title: "Tổng quan",
        paragraphs: [
          "Mage thuộc mô hình Offensive Caster. Enhancement cơ bản được Wiki khuyến nghị là Wizard.",
        ],
      },
      {
        id: "so-huu",
        title: "Cách sở hữu",
        paragraphs: [
          "Có thể chọn Mage khi bắt đầu nhân vật. Nguồn Wiki liệt kê thêm các địa điểm sở hữu.",
        ],
      },
      {
        id: "su-dung",
        title: "Tương tác kỹ năng",
        paragraphs: [
          "Explosion có tương tác với Scorched và có thể tác động nhiều mục tiêu. Gợi ý biên tập: đọc mô tả hiện tại trong game trước khi phối hợp kỹ năng.",
        ],
        note: "Chưa xác minh rotation tối ưu và build Forge/Awe. Các chỉ số xếp hạng sẽ không được suy đoán.",
      },
    ],
  },
  {
    ...base,
    category: "class",
    slug: "healer",
    title: "Healer",
    summary:
      "Thiên về hồi phục. Bắt đầu tìm hiểu vai trò hỗ trợ trong một nhóm.",
    role: "Hỗ trợ",
    ownership: "Miễn phí",
    enhancement: "Healer",
    strengths: "Bộ kỹ năng mang định hướng hồi phục.",
    weaknesses: "Vai trò hỗ trợ không đồng nghĩa phù hợp mọi đội hình.",
    sources: [wiki("healer", "Healer — AQWorlds Wiki")],
    sections: [
      {
        id: "tong-quan",
        title: "Tổng quan",
        paragraphs: [
          "Healer thuộc mô hình Defensive Caster. Wiki khuyến nghị Enhancement Healer cho nền tảng Class này.",
        ],
      },
      {
        id: "so-huu",
        title: "Cách sở hữu",
        paragraphs: [
          "Healer là một lựa chọn khởi đầu. Đối chiếu trang nguồn để xem các cách lấy lại Class.",
        ],
      },
      {
        id: "su-dung",
        title: "Chơi cùng đồng đội",
        paragraphs: [
          "Gợi ý biên tập: quan sát tình trạng của nhóm và tìm hiểu phạm vi từng kỹ năng hồi phục trước trận khó.",
        ],
        note: "Rotation và các build chuyên sâu đang cập nhật; chưa có đánh giá Ultra boss.",
      },
    ],
  },
];
export const farm: FarmingGuide = {
  ...base,
  category: "farm",
  slug: "blade-of-awe",
  title: "Ghép Blade of Awe",
  summary:
    "Theo dõi năm mảnh nguyên liệu, hoàn thành chuỗi quest tại Museum và chuẩn bị ghép kiếm.",
  difficulty: "Vừa",
  readMinutes: 5,
  sources: [
    wiki("valencia-s-quests", "Valencia’s Quests — mục Museum"),
    wiki("blade-of-awe", "Blade of Awe — công thức ghép"),
    wiki("museum", "Museum — địa điểm"),
    wiki("stonewrit-found", "Stonewrit Found! — nguồn rơi"),
    wiki("handle-found", "Handle Found! — nguồn rơi"),
    wiki("hilt-found", "Hilt Found! — nguồn rơi"),
    wiki("blade-found", "Blade Found! — nguồn rơi"),
    wiki("runes-found", "Runes Found! — nguồn rơi và ngoại lệ"),
  ],
  materials: [
    "Legendary Stonewrit ×1",
    "Legendary Handle ×1",
    "Legendary Hilt ×1",
    "Legendary Blade ×1",
    "Legendary Runes ×1",
  ],
  checklist: [
    {
      id: "stone",
      title: "Find the Stonewrit!",
      detail:
        "Nhận quest tại Valencia ở Museum. Tìm Stonewrit từ quái được liệt kê như Red Dragon; trả quest để nhận Legendary Stonewrit.",
    },
    {
      id: "handle",
      title: "Find the Handle!",
      detail:
        "Tiếp tục quest kế; tìm Handle từ quái được liệt kê như Earth Elemental (1).",
      requires: "stone",
    },
    {
      id: "hilt",
      title: "Find the Hilt!",
      detail:
        "Tìm Hilt từ quái được liệt kê như Skeleton (Monster) (1), sau khi xong bước trước.",
      requires: "handle",
    },
    {
      id: "blade",
      title: "Find the Blade!",
      detail:
        "Tìm Blade Found! từ Chaos Beast được liệt kê như Hydra Head (1); trả quest cho Valencia.",
      requires: "hilt",
    },
    {
      id: "runes",
      title: "Find the Runes!",
      detail:
        "Tìm Runes Found! từ Chaos Lord đủ điều kiện, trả quest để nhận Legendary Runes. Đối chiếu các trường hợp ngoại lệ ở trang nguồn Runes Found!.",
      requires: "blade",
    },
    {
      id: "merge",
      title: "Ghép tại cửa hàng",
      detail:
        "Chuẩn bị đủ năm mảnh và Rank 6 Blade of Awe, rồi kiểm tra công thức tại cửa hàng.",
      requires: "runes",
    },
  ],
  sections: [
    {
      id: "chuan-bi",
      title: "Trước khi bắt đầu",
      paragraphs: [
        "Đi Museum, chọn To The CrossRoads rồi nói chuyện với Valencia để mở chuỗi Blade of Awe. Các quest tìm mảnh đi lần lượt; quest sau yêu cầu hoàn thành quest trước.",
      ],
      command: "/join museum",
      note: "Lệnh được đối chiếu từ trang Museum. Tiến độ trên website là ghi chú cá nhân, không đồng bộ tài khoản game.",
    },
    {
      id: "nguyen-lieu",
      title: "Nguyên liệu và điều kiện",
      paragraphs: [
        "Công thức ghép cần mỗi mảnh Legendary một chiếc; vũ khí yêu cầu Rank 6 Blade of Awe. Không bán hoặc xóa các mảnh trước khi ghép.",
      ],
    },
    {
      id: "luu-y",
      title: "Chọn điểm farm",
      paragraphs: [
        "Gợi ý biên tập: kiểm tra đúng loại quái được quest chấp nhận, nhận quest trước rồi mới đánh. Nếu không thấy vật phẩm, kiểm tra lại quest và túi đồ.",
      ],
      note: "Chưa xác minh đầy đủ điểm farm tối ưu. Không ước tính thời gian hoàn thành hoặc tỷ lệ rơi.",
    },
  ],
};
export const item: Item = {
  ...base,
  category: "trang-bi",
  slug: "blade-of-awe",
  title: "Blade of Awe",
  itemType: "Vũ khí",
  summary: "Thanh kiếm ghép từ năm mảnh Legendary tại Museum.",
  sources: [wiki("blade-of-awe", "Blade of Awe — AQWorlds Wiki")],
  sections: [
    {
      id: "so-huu",
      title: "Nguồn sở hữu",
      paragraphs: [
        "Có thể ghép tại Blade of Awe Shop hoặc Gear of Awe ở Museum. Cần năm mảnh Legendary, mỗi loại một chiếc, và Rank 6 Blade of Awe.",
      ],
    },
    {
      id: "kiem-tra",
      title: "Trước khi ghép",
      paragraphs: [
        "Xem lại công thức hiện tại trong cửa hàng. Các biến thể có tên gần nhau cần được tra cứu riêng, không dùng chung điều kiện một cách mặc định.",
      ],
    },
  ],
  related: ["blade-of-awe", "enhancement"],
};
export const guides: Entry[] = [
  {
    ...base,
    category: "huong-dan",
    slug: "bat-dau",
    title: "Bắt đầu từ Battleon",
    summary:
      "Một lộ trình gọn để làm quen giao diện, chọn Class và đọc quest mà không bị ngợp.",
    readMinutes: 4,
    sources: [
      wiki("battleon", "Battleon — khu vực trung tâm"),
      wiki("the-story", "The Story — thư mục cốt truyện"),
    ],
    sections: [
      {
        id: "khoi-dau",
        title: "Bước vào Lore",
        paragraphs: [
          "Battleon là một điểm trung tâm để bạn định hướng hành trình. Bài này là lộ trình do ban biên tập đề xuất, không phải yêu cầu bắt buộc của game.",
        ],
        command: "/join battleon",
      },
      {
        id: "lam-quen",
        title: "Làm quen trước khi farm",
        paragraphs: [
          "Dành vài phút xem Inventory, bảng Class và nhật ký quest. Giữ tên Quest, NPC và Item bằng tiếng Anh để dễ đối chiếu.",
        ],
        steps: [
          "Đọc mục tiêu quest và điều kiện trả thưởng.",
          "Thử từng kỹ năng của Class đang mặc.",
          "Hoàn thành phần hướng dẫn hiện trong game trước khi nhảy sang chuỗi farm dài.",
        ],
      },
      {
        id: "tiep-theo",
        title: "Chọn mục tiêu tiếp theo",
        paragraphs: [
          "Muốn theo truyện, mở Book of Lore và đối chiếu thư mục The Story. Muốn tìm hiểu chiến đấu, đọc hồ sơ Class cùng bài Enhancement.",
        ],
        note: "Không cần chạy theo một danh sách endgame ngay ngày đầu. Lộ trình ở đây là gợi ý biên tập.",
      },
    ],
  },
  {
    ...base,
    category: "he-thong",
    slug: "enhancement",
    title: "Hiểu về Enhancement",
    summary:
      "Bắt đầu từ gợi ý của Class, rồi mới tìm hiểu các hệ Awe và Forge.",
    sources: [
      {
        title: "Artix: Enhancements & Stats",
        url: "https://www.aq.com/lore/guides/enhancementsandstats",
        checkedAt: date,
        kind: "official",
      },
      wiki("enhancements", "Enhancements — danh mục"),
      wiki("warrior-class", "Warrior — Fighter"),
      wiki("mage", "Mage — Wizard"),
      wiki("healer", "Healer — Enhancement cơ bản"),
    ],
    sections: [
      {
        id: "co-ban",
        title: "Chọn từ Class đang dùng",
        paragraphs: [
          "Trong bộ dữ liệu này, Wiki khuyến nghị Fighter cho Warrior, Wizard cho Mage và Healer cho Healer. Hãy xem đây là điểm khởi đầu.",
        ],
      },
      {
        id: "kiem-tra",
        title: "Áp dụng Enhancement",
        steps: [
          "Mở Game Menu → Shops → Enhancements theo hướng dẫn Artix.",
          "Chọn Enhancement rồi chọn đúng trang bị cần cường hóa.",
          "Xem thay đổi chỉ số trước khi xác nhận Enhance.",
        ],
        paragraphs: [
          "Gợi ý biên tập: đọc loại trang bị và yêu cầu của Enhancement trong game, rồi kiểm tra lại món đang mặc. Đừng suy ra lựa chọn chỉ từ vẻ ngoài của vũ khí.",
        ],
      },
      {
        id: "nang-cao",
        title: "Awe và Forge",
        paragraphs: [
          "Danh mục Wiki có các nhóm Awe và Forge cho những vị trí trang bị khác nhau. Build cụ thể phải được xét theo Class và mục tiêu.",
        ],
        note: "Các build nâng cao, điều kiện mở khóa và chỉ số chi tiết đang được biên soạn. Chưa có đề xuất tối ưu hóa endgame.",
      },
    ],
  },
  {
    ...base,
    category: "cot-truyen",
    slug: "hanh-trinh-chaos",
    title: "Theo dấu Chaos",
    summary:
      "Mục lục định hướng tuyến The Thirteen Lords of Chaos, tránh bỏ lỡ các chương.",
    sources: [wiki("the-story", "The Story — The Thirteen Lords of Chaos")],
    sections: [
      {
        id: "mo-dau",
        title: "Đi từ phần mở đầu",
        paragraphs: [
          "Thư mục The Story xếp The Prologue trước các chương về Chaos Lord. Dùng trang nguồn như mục lục, rồi làm quest theo Book of Lore trong game.",
        ],
      },
      {
        id: "chuong",
        title: "Các chặng đầu",
        paragraphs: [
          "Các mục đầu được liệt kê theo thứ tự: The Prologue, Escherion, Vath, Kitsune và Wolfwing. Đây là thứ tự của mục lục nguồn, không phải một bản tóm tắt mọi điều kiện quest.",
        ],
      },
      {
        id: "sau-chaos",
        title: "Những tuyến khác",
        paragraphs: [
          "The Queen of Monsters, The Throne of Darkness và The Shadows of War cũng có mục riêng trong thư mục.",
        ],
        note: "Chưa biên soạn walkthrough từng quest. Không tiết lộ hoặc tự tạo tình tiết truyện.",
      },
    ],
  },
  ...classes,
  farm,
  item,
  ...systemGuides,
  ...communityGuides,
];
export const categories = {
  "huong-dan": "Hướng dẫn",
  class: "Class",
  farm: "Farm",
  "trang-bi": "Trang bị",
  "he-thong": "Hệ thống",
  "cot-truyen": "Cốt truyện",
};
export function href(entry: Entry) {
  return `/${entry.category}/${entry.slug}`;
}

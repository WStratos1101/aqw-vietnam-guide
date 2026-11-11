import type { Guide, Source } from "../types/content";
const checkedAt = "2026-11-05";
const source = (url: string, title: string): Source => ({
  url,
  title,
  checkedAt,
  kind: "official",
});
const stats = source(
  "https://www.aq.com/lore/guides/enhancementsandstats",
  "Artix: Enhancements & Stats",
);
const combat = source(
  "https://www.aq.com/lore/guides/battling",
  "Artix: Battling",
);
const banking = source(
  "https://www.aq.com/lore/guides/banking",
  "Artix: Banking",
);
const membership = source(
  "https://support.artix.com/hc/en-us/articles/115000804312-AQWorlds-Membership-and-AdventureCoins",
  "Artix Support: Membership and AdventureCoins",
);
const lostItems = source(
  "https://support.artix.com/hc/en-us/articles/115000796331-I-lost-my-AQWorlds-equipment-items-AdventureCoins-etc",
  "Artix Support: Lost equipment and items",
);
const base = {
  category: "he-thong" as const,
  difficulty: "Dễ" as const,
  status: "Đã đối chiếu" as const,
  updatedAt: checkedAt,
  readMinutes: 3,
  related: ["bat-dau", "enhancement"],
};
export const systemGuides: Guide[] = [
  {
    ...base,
    slug: "stats",
    title: "Đọc chỉ số nhân vật",
    summary: "Hiểu sáu nhóm Stats trước khi thay Enhancement.",
    sources: [stats],
    sections: [
      {
        id: "mo-bang",
        title: "Xem Stats ở đâu?",
        paragraphs: [
          "Hướng dẫn Artix chỉ đường qua Character Menu → Stats & Class. Tại đây bạn xem chỉ số, kỹ năng và cơ chế lấy lại mana của Class.",
        ],
        note: "Tên và vị trí nút có thể thay đổi theo bản client. Bài này giải thích cơ chế nền tảng, không dùng ảnh giao diện cũ làm chỉ dẫn pixel.",
      },
      {
        id: "chi-so",
        title: "Sáu nhóm chỉ số",
        paragraphs: [
          "Strength thiên về sát thương vật lý; Intellect về phép; Endurance liên quan HP. Dexterity và Wisdom tác động đến độ chính xác, né tránh và các thuộc tính khác tùy mô hình Class. Luck cũng có ảnh hưởng đến chiến đấu.",
        ],
      },
      {
        id: "lua-chon",
        title: "Chọn theo Class",
        paragraphs: [
          "Gợi ý biên tập: đổi Enhancement rồi so sánh bảng Stats, không suy luận từ hình dáng vũ khí. Không có một chỉ số tốt nhất cho mọi Class.",
        ],
        note: "Không dùng bài nhập môn này để tính DPS hoặc khẳng định một build tối ưu.",
      },
    ],
  },
  {
    ...base,
    slug: "combat",
    title: "Chiến đấu cơ bản",
    summary: "Chọn mục tiêu, dùng kỹ năng và đọc thông tin trận đánh.",
    sources: [combat],
    sections: [
      {
        id: "muc-tieu",
        title: "Bắt đầu một trận",
        paragraphs: [
          "Theo hướng dẫn Artix, chọn quái bằng chuột rồi kích hoạt kỹ năng trên thanh chiến đấu. Phím 1–5 dùng cho kỹ năng; vị trí thứ sáu dành cho potion theo bố cục cơ bản.",
        ],
        steps: [
          "Chọn đúng mục tiêu.",
          "Đọc mô tả kỹ năng trước khi dùng.",
          "Quan sát HP, mana và cooldown khi đánh.",
        ],
      },
      {
        id: "danh-gia",
        title: "Đừng chỉ nhìn cấp độ",
        paragraphs: [
          "Biểu tượng sao dưới chân dung quái là một chỉ báo độ khó trong hướng dẫn Artix. Gợi ý biên tập: với boss có cơ chế riêng, đọc hướng dẫn trận đó thay vì suy ra từ sao hoặc level.",
        ],
      },
      {
        id: "phan-thuong",
        title: "Phần thưởng và boost",
        paragraphs: [
          "Quái có thể cho Gold, EXP, Class Points và vật phẩm. Boost có thời hạn hiển thị riêng; kiểm tra loại boost trước khi dùng.",
        ],
        note: "Bài không cam kết lượng EXP hay tốc độ lên cấp. Rotation cụ thể cần xét Class và trận đánh.",
      },
    ],
  },
  {
    ...base,
    slug: "reputation",
    title: "Hiểu về Reputation",
    summary: "Phân biệt Reputation của faction với cấp nhân vật và Class Rank.",
    sources: [
      source("https://www.aq.com/lore/guides/reputation", "Artix: Reputation"),
    ],
    sections: [
      {
        id: "faction",
        title: "Reputation thuộc faction",
        paragraphs: [
          "Reputation thể hiện tiến độ của bạn với một faction. Hướng dẫn Artix cho biết quest là một cách nhận Reputation.",
        ],
        note: "Gợi ý biên tập: đọc tên faction trong phần thưởng; không mặc định mọi quest cùng bản đồ đều cộng cùng loại Rep.",
      },
      {
        id: "cua-hang",
        title: "Điều kiện của cửa hàng",
        paragraphs: [
          "Một số NPC bán trang bị cần Reputation Rank đủ cao. Yêu cầu phải được kiểm tra ở đúng món đồ hoặc cửa hàng đang mở.",
        ],
      },
      {
        id: "quy-trinh",
        title: "Kiểm tra trước khi farm",
        paragraphs: [
          "Gợi ý biên tập: chọn món cần lấy rồi đi ngược về Rank yêu cầu và các quest phù hợp.",
        ],
        steps: [
          "Ghi lại tên faction và Rank cần đạt.",
          "Xem quest có thực sự thưởng Rep cho faction đó không.",
          "Hoàn thành quest, kiểm tra bảng Reputation rồi mới lặp lại.",
        ],
        note: "Chưa có bảng tốc độ farm hoặc thời gian đạt Rank; không suy đoán các con số này.",
      },
    ],
  },
  {
    ...base,
    slug: "hanh-trang",
    title: "Inventory và Bank",
    summary: "Cất đồ đúng chỗ, nhận biết AC-tag và kiểm tra vật phẩm bị thiếu.",
    sources: [banking, lostItems],
    sections: [
      {
        id: "mo-bank",
        title: "Mở Bank",
        paragraphs: [
          "Artix hướng dẫn gặp Augold tại Battleontown để mở Bank. Nếu có bank pet phù hợp, bạn cũng có thể mở từ pet.",
        ],
        command: "/join battleontown",
      },
      {
        id: "cat-do",
        title: "Chuyển đồ khỏi Inventory",
        paragraphs: [
          "Bank giúp giữ đồ ngoài túi đang mang. Hướng dẫn Banking ghi nhận AC items không chiếm slot Bank thông thường.",
        ],
        steps: [
          "Mở Bank và tìm đúng vật phẩm.",
          "Kiểm tra chiều chuyển trước khi xác nhận.",
          "Xem lại cả Inventory lẫn Bank nếu không tìm thấy món vừa cất.",
        ],
        note: "Không phải vật phẩm nào cũng cất được. Kiểm tra điều kiện của item trong client; bài không công bố giá slot hoặc giới hạn dung lượng hiện hành.",
      },
      {
        id: "mat-do",
        title: "Khi không tìm thấy item",
        paragraphs: [
          "Artix Support khuyên kiểm tra Bank trước. Buy Back áp dụng cho những giao dịch AC đủ điều kiện; resource mua bằng AC không được mua lại theo bài hỗ trợ. Temporary quest items không được khôi phục sau khi đăng xuất.",
        ],
        note: "Gợi ý biên tập: đừng bán hoặc xóa nguyên liệu chỉ để thử Buy Back; đọc điều kiện cụ thể trước.",
      },
    ],
  },
  {
    ...base,
    slug: "quest-mechanics",
    title: "Khi quest không tiến triển",
    summary:
      "Kiểm tra mục tiêu, NPC trả quest và điều kiện mở khóa trước khi báo lỗi.",
    sources: [
      source(
        "https://www.aq.com/lore/guides/quests",
        "Artix: Commonly Reported Quest Issues",
      ),
      lostItems,
    ],
    sections: [
      {
        id: "kiem-tra",
        title: "Đọc lại mục tiêu",
        paragraphs: [
          "Gợi ý biên tập: so lại tên quest, item và NPC; tìm xem bước hiện tại yêu cầu đánh quái, tương tác vật thể hay xem cutscene.",
        ],
        steps: [
          "Kiểm tra quest đang được nhận.",
          "Đọc mục tiêu và NPC/điểm hoàn thành.",
          "Đối chiếu điều kiện ở trang nguồn của đúng quest.",
        ],
      },
      {
        id: "phu-thuoc",
        title: "Một bước có thể mở bước sau",
        paragraphs: [
          "FAQ Artix nêu ví dụ Arcangrove: cần quay về Rayst giữa các nhánh để nhận quest dẫn sang khu vực kế tiếp. Thiếu quest đó có thể khiến khu vực mới chưa mở.",
        ],
      },
      {
        id: "tra-quest",
        title: "Không phải lúc nào cũng trả tại NPC cũ",
        paragraphs: [
          "FAQ cũng nêu quest The Miller’s Key yêu cầu mang chìa đến cửa mill, thay vì quay về Scoria. Hãy đọc hành động cần làm trong quest.",
        ],
        note: "Temporary quest items có thể mất khi đăng xuất. Đừng relog như bước sửa lỗi đầu tiên nếu chưa kiểm tra loại item đang giữ.",
      },
    ],
  },
  {
    ...base,
    slug: "gold-adventurecoins",
    title: "Gold và AdventureCoins",
    summary:
      "Hai loại tiền, các mục đích sử dụng và điều cần đọc trước khi chi tiêu.",
    sources: [
      source(
        "https://www.aq.com/info/handbook/currency.asp",
        "Artix Player Handbook: Currency",
      ),
      membership,
    ],
    sections: [
      {
        id: "gold",
        title: "Gold",
        paragraphs: [
          "Gold có thể đến từ quest, đánh quái và bán vật phẩm. Nhiều cửa hàng nhận Gold để bán trang bị và Enhancement.",
        ],
      },
      {
        id: "acs",
        title: "AdventureCoins",
        paragraphs: [
          "AdventureCoins, thường gọi là ACs, là loại tiền riêng. Một số vật phẩm, Class và mở rộng Inventory/Bank dùng ACs.",
        ],
        note: "Có nhãn AC không đồng nghĩa vật phẩm đó là phần thưởng Membership. Kiểm tra điều kiện từng món.",
      },
      {
        id: "chi-tieu",
        title: "Trước khi xác nhận",
        paragraphs: [
          "Gợi ý biên tập: đọc đơn vị tiền, giá, điều kiện dùng và sellback của món định mua. Website không bán ACs hoặc nhận giao dịch trong game.",
        ],
        note: "Không đăng bảng giá gói hoặc khuyến mãi vì chúng thay đổi. Đối chiếu trực tiếp trang Artix khi cần mua.",
      },
    ],
  },
  {
    ...base,
    slug: "membership",
    title: "Membership là gì?",
    summary: "Phân biệt nâng cấp tài khoản với số dư AdventureCoins.",
    sources: [membership],
    sections: [
      {
        id: "phan-biet",
        title: "Hai khái niệm khác nhau",
        paragraphs: [
          "Artix Support phân biệt Membership của tài khoản với AdventureCoins. Sở hữu ACs không tự biến tài khoản thành Member.",
        ],
      },
      {
        id: "quyen-loi",
        title: "Quyền lợi theo tài khoản",
        paragraphs: [
          "Trang hỗ trợ liệt kê quyền truy cập một số khu vực, đồ, pet và server dành cho Member, cùng quyền tạo guild. Điều kiện từng nội dung vẫn cần kiểm tra riêng.",
        ],
      },
      {
        id: "quyet-dinh",
        title: "Kiểm tra trước khi nâng cấp",
        paragraphs: [
          "Gợi ý biên tập: xác định nội dung muốn chơi có thực sự cần Membership không, rồi đọc gói và thời hạn tại trang chính thức.",
        ],
        note: "Website không thu tiền, không bán gói nâng cấp và không cam kết bonus package cụ thể. Quyền lợi và ưu đãi có thể được Artix cập nhật.",
      },
    ],
  },
];

import catalog from "./imported/catalog.json";
import type { Guide, Source, SectionKey, ImportedPage } from "../types/content";
const rows = catalog as ImportedPage[];
export const importedCatalog = rows;
export const nativeGuides: Guide[] = rows.map((page) => ({
  slug: page.slug,
  title: page.title,
  category: page.category as SectionKey,
  summary: page.summary,
  difficulty: "Chưa đánh giá",
  status: "Theo tài liệu cộng đồng",
  updatedAt: page.readAt,
  readMinutes: page.readMinutes,
  sources: [
    {
      title: page.documentTitle + " — AQW Vietnam / Vietnam Collector",
      url: `https://docs.google.com/document/d/${page.documentId}/edit`,
      accessedAt: page.readAt,
      kind: "community-guide",
    },
  ],
  sections: page.sections,
  related: [],
  imported: page,
}));
const sourceTitles: Record<string, string> = {
  "game-guide": "Cẩm nang game",
  "class-guide": "Class và cách sử dụng",
  "farming-guide": "Farm vật phẩm",
  "challenge-guide": "Challenge Boss",
  "bonus-guide": "Upgrade Bonus",
};
const sourceKeys = Object.keys(sourceTitles);
const hub: Guide = {
  slug: "cam-nang-aqw-vietnam",
  title: "Cẩm nang AQW Vietnam",
  category: "huong-dan",
  summary:
    "Toàn bộ chương hướng dẫn được tổ chức thành bài đọc trên website: game, Class, farm vật phẩm và Challenge Boss.",
  difficulty: "Dễ",
  status: "Theo tài liệu cộng đồng",
  updatedAt: "2026-11-05",
  readMinutes: 3,
  sources: sourceKeys.map(
    (key) =>
      nativeGuides.find((g) => g.imported?.id.startsWith(key + "-"))!
        .sources[0],
  ),
  related: ["bat-dau"],
  sections: [
    {
      id: "cach-tra-cuu",
      title: "Chọn hành trình của bạn",
      paragraphs: [
        "Chọn một chương để đọc nội dung đầy đủ ngay trên website. Có thể tìm theo tên Class, Item, NPC, quest hoặc địa điểm ở thư viện.",
        "Nội dung được chuyển từ cẩm nang AQW Vietnam / Vietnam Collector. Các build, nhận xét và thông số giữ theo bản nguồn cộng đồng; ngày đọc nguồn không có nghĩa mọi dữ kiện đã được kiểm chứng lại trong game.",
      ],
    },
    ...sourceKeys.map((key) => ({
      id: key,
      title: sourceTitles[key],
      paragraphs: [],
      links: nativeGuides
        .filter(
          (g) => g.imported?.id.startsWith(key + "-") && g.imported.level === 1,
        )
        .map((g) => ({ title: g.title, url: `/${g.category}/${g.slug}` })),
    })),
  ],
};
const alias = (sourceSlug: string, category: SectionKey, slug: string) => {
  const guide = nativeGuides.find((g) => g.slug === sourceSlug);
  if (!guide) throw Error("Missing migrated guide " + sourceSlug);
  return { ...guide, category, slug };
};
export const communityGuides: Guide[] = [
  hub,
  ...nativeGuides,
  alias("game-commands", "huong-dan", "lenh-game"),
  alias("acronyms-thuat-ngu-hay-dung", "he-thong", "thuat-ngu-aqw"),
  alias("general-boosted", "he-thong", "hieu-ve-boost"),
];

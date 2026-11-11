export type SectionKey =
  | "huong-dan"
  | "class"
  | "farm"
  | "trang-bi"
  | "he-thong"
  | "cot-truyen";
export interface Source {
  title: string;
  url: string;
  checkedAt?: string;
  accessedAt?: string;
  kind: "official" | "community" | "community-guide";
}
export interface ContentSection {
  id: string;
  title: string;
  paragraphs: string[];
  steps?: string[];
  command?: string;
  note?: string;
  links?: { title: string; url: string }[];
  terms?: { term: string; definition: string }[];
  blocks?: RichBlock[];
}
export interface Guide {
  slug: string;
  title: string;
  category: SectionKey;
  summary: string;
  difficulty: "Dễ" | "Vừa" | "Chưa đánh giá";
  status: "Đã đối chiếu" | "Đang cập nhật" | "Theo tài liệu cộng đồng";
  updatedAt: string;
  readMinutes: number;
  sources: Source[];
  sections: ContentSection[];
  related: string[];
  level?: number;
  imported?: ImportedPage;
}
export interface GameClass extends Guide {
  category: "class";
  role: "Cận chiến" | "Phép thuật" | "Hỗ trợ";
  ownership: "Miễn phí";
  enhancement: string;
  strengths: string;
  weaknesses: string;
  rotation?: string;
}
export interface FarmStep {
  id: string;
  title: string;
  detail: string;
  requires?: string;
}
export interface FarmingGuide extends Guide {
  category: "farm";
  checklist: FarmStep[];
  materials: string[];
}
export interface Item extends Guide {
  category: "trang-bi";
  itemType:
    | "Vũ khí"
    | "Giáp"
    | "Mũ"
    | "Áo choàng"
    | "Thú cưng"
    | "Vật phẩm khác";
}
export type Entry = Guide | GameClass | FarmingGuide | Item;

export interface RichRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  sup?: boolean;
  href?: string;
}
export type RichBlock =
  | {
      type: "paragraph" | "heading";
      id: string;
      runs: RichRun[];
      level?: number;
      listDepth?: number;
    }
  | {
      type: "table";
      id: string;
      rows: {
        cells: { colSpan: number; rowSpan: number; blocks: RichBlock[] }[];
      }[];
    };
export interface ImportedPage {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  sourceTitle: string;
  sourceHeadingId: string;
  documentId: string;
  documentTitle: string;
  sourceGroup: string;
  groupId: string | null;
  parentId: string | null;
  level: number;
  sourceModifiedAt: string;
  sourceFormat?: string;
  readAt: string;
  readMinutes: number;
  bodyUrl: string;
  sections: ContentSection[];
  missingImageCount: number;
}
export interface ImportedBody {
  sections: ContentSection[];
  previous?: { title: string; url: string };
  next?: { title: string; url: string };
  missingImageCount: number;
}

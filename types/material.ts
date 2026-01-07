// Material types for construction training PDFs
export type MaterialCategory = 
  | 'temporary' // 仮設工事
  | 'retention' // 山留工事
  | 'pile' // 杭工事
  | 'excavation' // 掘削工事
  | 'framework' // 躯体工事・型枠
  | 'rebar' // 鉄筋工事
  | 'concrete'; // コンクリート工事

export type Material = {
  id: string;
  title: string;
  category: MaterialCategory;
  pdfFileName: string;
  totalPages: number;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
};

export type Chapter = {
  id: string;
  title: string;
  order: number;
  startPage: number;
  endPage: number;
  pages: Page[];
};

export type Page = {
  id: string;
  pageNumber: number; // 1-indexed
  imageUrl: string; // /materials/{materialId}/pages/{pageNumber}.png
  thumbnailUrl: string; // /materials/{materialId}/thumbnails/{pageNumber}.png
  instructorNotes: InstructorNote[];
  glossary: GlossaryTerm[];
  checklist: CheckItem[];
  highlights: Highlight[];
};

export type InstructorNote = {
  id: string;
  content: string;
  order: number;
  visible: boolean; // 受講者に表示するか
};

export type GlossaryTerm = {
  id: string;
  term: string;
  reading?: string; // ふりがな
  definition: string;
  importance: 'high' | 'medium' | 'low';
};

export type CheckItem = {
  id: string;
  text: string;
  order: number;
  checked: boolean;
  note?: string; // NG時の理由など
  category: 'safety' | 'quality' | 'procedure' | 'inspection';
};

export type Highlight = {
  id: string;
  type: 'attention' | 'caution' | 'important' | 'reference';
  x: number; // パーセント座標 (0-100)
  y: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
};

export type MaterialMetadata = {
  materialId: string;
  pages: Record<number, PageMetadata>; // pageNumber -> metadata
};

export type PageMetadata = {
  pageNumber: number;
  instructorNotes: InstructorNote[];
  glossary: GlossaryTerm[];
  checklist: CheckItem[];
  highlights: Highlight[];
};

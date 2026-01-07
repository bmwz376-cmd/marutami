// Annotation types for instructor drawing tools
export type AnnotationType = 'pin' | 'circle' | 'rect' | 'pen' | 'laser';

export type Annotation = {
  id: string;
  pageNumber: number;
  type: AnnotationType;
  data: AnnotationData;
  color: string;
  createdAt: Date;
  temporary?: boolean; // レーザーポインタ用 (3秒で消える)
};

export type AnnotationData =
  | PinData
  | CircleData
  | RectData
  | PenData
  | LaserData;

export type PinData = {
  type: 'pin';
  x: number; // パーセント座標 (0-100)
  y: number;
  label?: string;
  size?: number; // デフォルト: 24px
};

export type CircleData = {
  type: 'circle';
  cx: number; // center x
  cy: number; // center y
  radius: number;
  strokeWidth: number;
  fill?: boolean;
};

export type RectData = {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
  fill?: boolean;
};

export type PenData = {
  type: 'pen';
  points: Point[];
  strokeWidth: number;
  smoothing?: boolean;
};

export type LaserData = {
  type: 'laser';
  x: number;
  y: number;
  timestamp: number;
};

export type Point = {
  x: number;
  y: number;
};

// Annotation drawing tool state
export type AnnotationTool = AnnotationType | 'select' | null;

export type DrawingState = {
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  isDrawing: boolean;
  currentAnnotation: Partial<Annotation> | null;
};

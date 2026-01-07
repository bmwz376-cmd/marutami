// Room and session types for live instruction
export type Room = {
  id: string;
  materialId: string;
  instructorId: string;
  currentPage: number;
  syncEnabled: boolean;
  annotations: Annotation[];
  participants: Participant[];
  importantPoint: ImportantPoint | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Participant = {
  id: string;
  socketId: string;
  name?: string;
  role: 'instructor' | 'student';
  joinedAt: Date;
  lastSeenAt: Date;
  currentPage?: number; // 受講者の現在ページ (sync off時)
};

export type RoomState = {
  roomId: string;
  materialId: string;
  currentPage: number;
  syncEnabled: boolean;
  annotations: Annotation[];
  participants: Participant[];
  importantPoint: ImportantPoint | null;
};

export type ImportantPoint = {
  id: string;
  title: string;
  points: string[];
  displayedAt: Date;
};

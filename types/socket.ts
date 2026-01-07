import type { Annotation } from './annotation';
import type { Participant, RoomState, ImportantPoint } from './room';

// Server -> Client events
export type ServerToClientEvents = {
  // Page synchronization
  'page:changed': (data: { pageNumber: number; timestamp: number }) => void;

  // Sync control
  'sync:toggled': (data: { enabled: boolean }) => void;

  // Annotations
  'annotation:added': (annotation: Annotation) => void;
  'annotation:removed': (data: { id: string }) => void;
  'annotation:cleared': (data: { pageNumber?: number }) => void;

  // Important points display
  'important:show': (data: ImportantPoint) => void;
  'important:hide': () => void;

  // Participants
  'participant:joined': (participant: Participant) => void;
  'participant:left': (data: { id: string; socketId: string }) => void;
  'participant:updated': (participant: Participant) => void;

  // Room state (for reconnection)
  'room:state': (state: RoomState) => void;
  'room:error': (data: { message: string }) => void;

  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
};

// Client -> Server events
export type ClientToServerEvents = {
  // Room management
  'room:join': (data: {
    roomId: string;
    role: 'instructor' | 'student';
    name?: string;
  }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:request-state': (data: { roomId: string }) => void;

  // Page control (instructor only)
  'page:change': (data: { pageNumber: number }) => void;

  // Sync control (instructor only)
  'sync:toggle': (data: { enabled: boolean }) => void;

  // Annotations (instructor only)
  'annotation:add': (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  'annotation:remove': (data: { id: string }) => void;
  'annotation:clear': (data: { pageNumber?: number }) => void;

  // Important points (instructor only)
  'important:display': (data: Omit<ImportantPoint, 'id' | 'displayedAt'>) => void;
  'important:dismiss': () => void;

  // Participant updates
  'participant:update-page': (data: { pageNumber: number }) => void;
};

// Socket data stored in socket.data
export type SocketData = {
  roomId?: string;
  participantId?: string;
  role?: 'instructor' | 'student';
};

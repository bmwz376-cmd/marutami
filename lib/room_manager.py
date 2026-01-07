"""
ルーム管理モジュール - WebSocket同期のための状態管理
"""
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import json


@dataclass
class Participant:
    """参加者情報"""
    id: str
    name: str
    role: str  # "instructor" or "student"
    joined_at: str
    
    def to_dict(self):
        return asdict(self)


@dataclass
class Annotation:
    """注釈情報"""
    id: str
    page_number: int
    type: str  # "pin", "circle", "rect", "pen", "laser"
    data: dict
    timestamp: str
    temporary: bool = False
    
    def to_dict(self):
        return asdict(self)


class Room:
    """講義ルーム"""
    
    def __init__(self, room_id: str, material_id: str, instructor_id: str):
        self.room_id = room_id
        self.material_id = material_id
        self.instructor_id = instructor_id
        self.current_page = 1
        self.sync_enabled = True
        self.participants: Dict[str, Participant] = {}
        self.annotations: List[Annotation] = []
        self.created_at = datetime.now().isoformat()
    
    def add_participant(self, participant: Participant):
        """参加者追加"""
        self.participants[participant.id] = participant
    
    def remove_participant(self, participant_id: str):
        """参加者削除"""
        if participant_id in self.participants:
            del self.participants[participant_id]
    
    def set_page(self, page_number: int):
        """ページ設定"""
        self.current_page = page_number
    
    def toggle_sync(self, enabled: bool):
        """同期ON/OFF"""
        self.sync_enabled = enabled
    
    def add_annotation(self, annotation: Annotation):
        """注釈追加"""
        self.annotations.append(annotation)
    
    def remove_annotation(self, annotation_id: str):
        """注釈削除"""
        self.annotations = [a for a in self.annotations if a.id != annotation_id]
    
    def clear_annotations(self):
        """注釈全削除"""
        self.annotations = []
    
    def get_state(self) -> dict:
        """現在状態取得"""
        return {
            "room_id": self.room_id,
            "material_id": self.material_id,
            "current_page": self.current_page,
            "sync_enabled": self.sync_enabled,
            "participants": [p.to_dict() for p in self.participants.values()],
            "annotations": [a.to_dict() for a in self.annotations],
            "created_at": self.created_at
        }


class RoomManager:
    """ルーム管理マネージャー"""
    
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
    
    def create_room(self, room_id: str, material_id: str, instructor_id: str) -> Room:
        """ルーム作成"""
        if room_id in self.rooms:
            return self.rooms[room_id]
        
        room = Room(room_id, material_id, instructor_id)
        self.rooms[room_id] = room
        return room
    
    def get_room(self, room_id: str) -> Optional[Room]:
        """ルーム取得"""
        return self.rooms.get(room_id)
    
    def delete_room(self, room_id: str):
        """ルーム削除"""
        if room_id in self.rooms:
            del self.rooms[room_id]
    
    def get_all_rooms(self) -> List[dict]:
        """全ルーム取得"""
        return [room.get_state() for room in self.rooms.values()]


# グローバルインスタンス
room_manager = RoomManager()

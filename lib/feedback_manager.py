"""
フィードバック管理モジュール
"""
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
import json
from typing import List, Optional


@dataclass
class Feedback:
    """フィードバック情報"""
    id: str
    timestamp: str
    room_id: str
    user_role: str  # "instructor" or "student"
    user_name: str
    
    # 評価（1-5）
    rating_sync_speed: int  # ページ同期速度
    rating_annotation: int  # 注釈ツール使いやすさ
    rating_metadata: int    # 用語・チェックリストの有用性
    rating_ui: int          # UI分かりやすさ
    rating_overall: int     # 総合評価
    
    # 自由記述
    comment_good: str       # 良かった点
    comment_bad: str        # 改善が必要な点
    comment_feature: str    # 追加してほしい機能
    
    # 技術的問題
    technical_issues: List[str]  # 発生した問題
    
    def to_dict(self):
        return asdict(self)


class FeedbackManager:
    """フィードバック管理"""
    
    def __init__(self, storage_path: str = "data/feedback.json"):
        self.storage_path = Path(storage_path)
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        
        if not self.storage_path.exists():
            self._save([])
    
    def add_feedback(self, feedback: Feedback):
        """フィードバック追加"""
        feedbacks = self._load()
        feedbacks.append(feedback.to_dict())
        self._save(feedbacks)
    
    def get_all_feedbacks(self) -> List[dict]:
        """全フィードバック取得"""
        return self._load()
    
    def get_feedback_by_room(self, room_id: str) -> List[dict]:
        """ルームIDでフィルタ"""
        feedbacks = self._load()
        return [f for f in feedbacks if f["room_id"] == room_id]
    
    def get_statistics(self) -> dict:
        """統計情報生成"""
        feedbacks = self._load()
        
        if not feedbacks:
            return {
                "total_count": 0,
                "average_ratings": {},
                "common_issues": []
            }
        
        # 平均評価
        ratings = {
            "sync_speed": [],
            "annotation": [],
            "metadata": [],
            "ui": [],
            "overall": []
        }
        
        for fb in feedbacks:
            if fb.get("rating_sync_speed") is not None:
                ratings["sync_speed"].append(fb["rating_sync_speed"])
            if fb.get("rating_annotation") is not None:
                ratings["annotation"].append(fb["rating_annotation"])
            if fb.get("rating_metadata") is not None:
                ratings["metadata"].append(fb["rating_metadata"])
            if fb.get("rating_ui") is not None:
                ratings["ui"].append(fb["rating_ui"])
            if fb.get("rating_overall") is not None:
                ratings["overall"].append(fb["rating_overall"])
        
        avg_ratings = {
            key: sum(values) / len(values) if values else 0
            for key, values in ratings.items()
        }
        
        # よくある問題の集計
        all_issues = []
        for fb in feedbacks:
            all_issues.extend(fb["technical_issues"])
        
        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1
        
        common_issues = sorted(
            issue_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return {
            "total_count": len(feedbacks),
            "instructor_count": len([f for f in feedbacks if f["user_role"] == "instructor"]),
            "student_count": len([f for f in feedbacks if f["user_role"] == "student"]),
            "average_ratings": avg_ratings,
            "common_issues": common_issues,
            "latest_feedback": feedbacks[-1] if feedbacks else None
        }
    
    def _load(self) -> List[dict]:
        """ファイルから読み込み"""
        if not self.storage_path.exists():
            return []
        
        with open(self.storage_path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def _save(self, feedbacks: List[dict]):
        """ファイルに保存"""
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(feedbacks, f, ensure_ascii=False, indent=2)


# グローバルインスタンス
feedback_manager = FeedbackManager()

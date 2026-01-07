"""
教材プラットフォーム - Flaskメインアプリケーション
"""
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import config
from lib.room_manager import room_manager, Participant, Annotation
from lib.feedback_manager import feedback_manager, Feedback
from pathlib import Path
import json
import uuid
from datetime import datetime

# Flaskアプリ初期化
app = Flask(__name__)
app.config.from_object(config)
CORS(app)

# Socket.IO初期化
socketio = SocketIO(
    app,
    cors_allowed_origins=config.SOCKETIO_CORS_ALLOWED_ORIGINS,
    async_mode='threading'
)


# ========================================
# HTTP Routes
# ========================================

@app.route("/")
def index():
    """教材一覧ページ"""
    manifest = load_manifest()
    return render_template("index.html", materials=manifest.get("materials", []))


@app.route("/instructor/<room_id>")
def instructor_view(room_id):
    """講師画面"""
    room = room_manager.get_room(room_id)
    
    # ルームが存在しない場合はデフォルト教材で作成
    if not room:
        print(f"ルーム {room_id} が存在しないため、デフォルト教材で作成します")
        default_material_id = "⑧鉄筋工事１"
        instructor_id = "default_instructor"
        room = room_manager.create_room(room_id, default_material_id, instructor_id)
        print(f"ルーム作成完了: {room_id}, 教材: {default_material_id}")
    
    material_id = room.material_id if room else None
    return render_template("instructor.html", room_id=room_id, material_id=material_id)


@app.route("/student/<room_id>")
def student_view(room_id):
    """受講者画面"""
    room = room_manager.get_room(room_id)
    
    # ルームが存在しない場合はエラー（受講者は講師がルームを作成してから入室すべき）
    if not room:
        return "このルームは存在しません。講師にルームURLを確認してください。", 404
    
    material_id = room.material_id if room else None
    return render_template("student.html", room_id=room_id, material_id=material_id)


@app.route("/test/annotations")
def test_annotations():
    """注釈機能テストページ"""
    return render_template("test_annotations.html")


@app.route("/debug/instructor/<room_id>")
def debug_instructor(room_id):
    """講師画面デバッグページ"""
    room = room_manager.get_room(room_id)
    
    # ルームが存在しない場合はデフォルト教材で作成
    if not room:
        print(f"デバッグ: ルーム {room_id} が存在しないため、デフォルト教材で作成します")
        default_material_id = "⑧鉄筋工事１"
        instructor_id = "debug_instructor"
        room = room_manager.create_room(room_id, default_material_id, instructor_id)
        print(f"デバッグ: ルーム作成完了: {room_id}, 教材: {default_material_id}")
    
    material_id = room.material_id if room else None
    return render_template("debug_instructor.html", room_id=room_id, material_id=material_id)


@app.route("/admin")
def admin_view():
    """管理画面"""
    return render_template("admin.html")


@app.route("/feedback")
def feedback_view():
    """フィードバックフォーム"""
    return render_template("feedback.html")


@app.route("/feedback/analytics")
def feedback_analytics_view():
    """フィードバック集計画面"""
    return render_template("feedback_analytics.html")


# ========================================
# API Routes
# ========================================

@app.route("/api/materials")
def get_materials():
    """教材一覧API"""
    manifest = load_manifest()
    return jsonify(manifest)


@app.route("/api/materials/<material_id>")
def get_material(material_id):
    """教材詳細API"""
    metadata_path = config.MATERIALS_DIR / material_id / "metadata.json"
    
    if not metadata_path.exists():
        return jsonify({"error": "Material not found"}), 404
    
    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    
    return jsonify(metadata)


@app.route("/api/rooms", methods=["POST"])
def create_room():
    """ルーム作成API"""
    data = request.json
    material_id = data.get("material_id")
    instructor_id = data.get("instructor_id", str(uuid.uuid4()))
    room_id = data.get("room_id", str(uuid.uuid4())[:8])
    
    room = room_manager.create_room(room_id, material_id, instructor_id)
    
    return jsonify({
        "room_id": room_id,
        "instructor_url": f"/instructor/{room_id}",
        "student_url": f"/student/{room_id}"
    })


@app.route("/api/rooms/<room_id>")
def get_room(room_id):
    """ルーム状態取得API"""
    room = room_manager.get_room(room_id)
    
    if not room:
        return jsonify({"error": "Room not found"}), 404
    
    return jsonify(room.get_state())


@app.route("/api/rooms")
def get_all_rooms():
    """全ルーム一覧API"""
    rooms = room_manager.get_all_rooms()
    return jsonify({"rooms": rooms})


@app.route("/api/feedback", methods=["GET", "POST"])
def handle_feedback():
    """フィードバックAPI"""
    if request.method == "POST":
        # フィードバック送信
        data = request.json
        ratings = data.get("ratings", {})
        comments = data.get("comments", {})
        
        feedback = Feedback(
            id=str(uuid.uuid4()),
            timestamp=datetime.now().isoformat(),
            room_id=data.get("room_id", ""),
            user_role=data.get("role", "student"),
            user_name=data.get("user_name", "匿名"),
            rating_sync_speed=ratings.get("sync_speed", 3),
            rating_annotation=ratings.get("annotation_clarity", 3),
            rating_metadata=ratings.get("metadata_quality", 3),
            rating_ui=ratings.get("ui_usability", 3),
            rating_overall=ratings.get("overall", 3),
            comment_good=comments.get("good_points", ""),
            comment_bad=comments.get("improvements", ""),
            comment_feature=comments.get("feature_requests", ""),
            technical_issues=data.get("technical_issues", [])
        )
        
        feedback_manager.add_feedback(feedback)
        
        return jsonify({"success": True, "id": feedback.id})
    
    else:
        # フィードバック一覧取得
        feedbacks = feedback_manager.get_all_feedbacks()
        return jsonify(feedbacks)


@app.route("/api/feedback/statistics")
def get_feedback_statistics():
    """フィードバック統計API"""
    stats = feedback_manager.get_statistics()
    return jsonify(stats)


@app.route("/api/feedback/analytics")
def get_feedback_analytics():
    """フィードバック分析API（統計と同じ）"""
    stats = feedback_manager.get_statistics()
    return jsonify(stats)


# ========================================
# WebSocket Events
# ========================================

@socketio.on("connect")
def handle_connect():
    """クライアント接続"""
    print(f"Client connected: {request.sid}")
    emit("connected", {"sid": request.sid})


@socketio.on("disconnect")
def handle_disconnect():
    """クライアント切断"""
    print(f"Client disconnected: {request.sid}")
    
    # 全ルームから削除
    for room in room_manager.rooms.values():
        if request.sid in room.participants:
            room.remove_participant(request.sid)
            emit("participant:left", {"id": request.sid}, room=room.room_id)


@socketio.on("room:join")
def handle_room_join(data):
    """ルーム参加"""
    room_id = data.get("room_id")
    role = data.get("role", "student")
    name = data.get("name", "匿名")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        emit("error", {"message": "Room not found"})
        return
    
    # ルーム参加
    join_room(room_id)
    
    # 参加者追加
    participant = Participant(
        id=request.sid,
        name=name,
        role=role,
        joined_at=datetime.now().isoformat()
    )
    room.add_participant(participant)
    
    # 現在状態を送信（途中参加対応）
    emit("room:state", room.get_state())
    
    # 他の参加者に通知
    emit("participant:joined", participant.to_dict(), room=room_id, skip_sid=request.sid)
    
    print(f"Participant joined: {name} ({role}) in room {room_id}")


@socketio.on("room:leave")
def handle_room_leave(data):
    """ルーム退出"""
    room_id = data.get("room_id")
    
    room = room_manager.get_room(room_id)
    if room:
        room.remove_participant(request.sid)
        leave_room(room_id)
        emit("participant:left", {"id": request.sid}, room=room_id)


@socketio.on("page:change")
def handle_page_change(data):
    """ページ変更（講師のみ）"""
    room_id = data.get("room_id")
    page_number = data.get("page_number")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        emit("error", {"message": "Room not found"})
        return
    
    # 講師チェック
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        emit("error", {"message": "Permission denied"})
        return
    
    # ページ更新
    room.set_page(page_number)
    
    # 全員に同期
    emit("page:changed", {"page_number": page_number}, room=room_id)
    
    print(f"Page changed to {page_number} in room {room_id}")


@socketio.on("sync:toggle")
def handle_sync_toggle(data):
    """同期ON/OFF（講師のみ）"""
    room_id = data.get("room_id")
    enabled = data.get("enabled")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        return
    
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        return
    
    room.toggle_sync(enabled)
    emit("sync:toggled", {"enabled": enabled}, room=room_id)


@socketio.on("annotation:add")
def handle_annotation_add(data):
    """注釈追加（講師のみ）"""
    room_id = data.get("room_id")
    annotation_data = data.get("annotation")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        return
    
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        return
    
    annotation = Annotation(
        id=annotation_data.get("id", str(uuid.uuid4())),
        page_number=annotation_data.get("page_number"),
        type=annotation_data.get("type"),
        data=annotation_data.get("data"),
        timestamp=datetime.now().isoformat(),
        temporary=annotation_data.get("temporary", False)
    )
    
    room.add_annotation(annotation)
    emit("annotation:added", annotation.to_dict(), room=room_id)


@socketio.on("annotation:remove")
def handle_annotation_remove(data):
    """注釈削除（講師のみ）"""
    room_id = data.get("room_id")
    annotation_id = data.get("annotation_id")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        return
    
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        return
    
    room.remove_annotation(annotation_id)
    emit("annotation:removed", {"id": annotation_id}, room=room_id)


@socketio.on("annotation:clear")
def handle_annotation_clear(data):
    """注釈全削除（講師のみ）"""
    room_id = data.get("room_id")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        return
    
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        return
    
    room.clear_annotations()
    emit("annotation:cleared", {}, room=room_id)


@socketio.on("important:display")
def handle_important_display(data):
    """重要ポイントカード表示（講師のみ）"""
    room_id = data.get("room_id")
    title = data.get("title")
    points = data.get("points")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        return
    
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        return
    
    emit("important:show", {"title": title, "points": points}, room=room_id)


@socketio.on("important:hide")
def handle_important_hide(data):
    """重要ポイントカード非表示（講師のみ）"""
    room_id = data.get("room_id")
    
    room = room_manager.get_room(room_id)
    
    if not room:
        return
    
    participant = room.participants.get(request.sid)
    if not participant or participant.role != "instructor":
        return
    
    emit("important:hide", {}, room=room_id)


# ========================================
# Utility Functions
# ========================================

def load_manifest():
    """manifest.json読み込み"""
    manifest_path = config.MATERIALS_DIR / "manifest.json"
    
    if not manifest_path.exists():
        return {"version": "1.0", "materials": []}
    
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


# ========================================
# Application Entry
# ========================================

if __name__ == "__main__":
    print(f"=== 教材プラットフォーム起動 ===")
    print(f"教材ディレクトリ: {config.MATERIALS_DIR}")
    print(f"URL: http://localhost:5000")
    print()
    
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=config.DEBUG,
        allow_unsafe_werkzeug=True
    )

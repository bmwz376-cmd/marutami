#!/usr/bin/env python3
"""
講義デモスクリプト
⑧鉄筋工事１で30分のデモ講義を実施
"""
import requests
import json
import time

BASE_URL = "http://localhost:5000"

def create_room(material_id):
    """ルーム作成"""
    response = requests.post(
        f"{BASE_URL}/api/rooms",
        json={"material_id": material_id}
    )
    return response.json()

def get_material(material_id):
    """教材情報取得"""
    response = requests.get(f"{BASE_URL}/api/materials/{material_id}")
    return response.json()

def main():
    print("=" * 60)
    print("教材プラットフォーム - 講義デモ")
    print("=" * 60)
    print()
    
    # 教材選択
    material_id = "⑧鉄筋工事１"
    print(f"📚 使用教材: {material_id}")
    
    # 教材情報取得
    print("📖 教材情報を取得中...")
    material = get_material(material_id)
    print(f"   ✓ ページ数: {len(material['pages'])}")
    print(f"   ✓ 章数: {len(material['chapters'])}")
    print()
    
    # ルーム作成
    print("🚪 講義ルームを作成中...")
    room = create_room(material_id)
    room_id = room['room_id']
    print(f"   ✓ ルームID: {room_id}")
    print()
    
    # URL表示
    print("=" * 60)
    print("📌 講義URL")
    print("=" * 60)
    print()
    print(f"🎓 講師用URL:")
    print(f"   {BASE_URL}{room['instructor_url']}")
    print()
    print(f"👥 受講者用URL:")
    print(f"   {BASE_URL}{room['student_url']}")
    print()
    print("=" * 60)
    print()
    
    # 講義シナリオ
    print("📋 講義シナリオ（30分）")
    print("=" * 60)
    print()
    print("【0-5分】導入")
    print("  - ページ1-3: 配筋の基本、RC造の特徴")
    print("  - 注釈: ピンで鉄筋とコンクリートの位置を指示")
    print()
    print("【5-15分】基本知識")
    print("  - ページ4: 鉄筋の種類（SD295A, SD345）")
    print("  - ページ5: 定着・重ね継手")
    print("  - ページ6-7: あきとかぶり")
    print("  - 注釈: レーザーポインタで図を説明")
    print("  - 重要ポイント: 「定着長さの計算」カード")
    print()
    print("【15-25分】実践知識")
    print("  - ページ8-10: 鉄筋の役割と配置")
    print("  - 注釈: ピンで主筋・帯筋の位置を指示")
    print("  - 重要ポイント: 「配筋検査の確認要点」カード")
    print()
    print("【25-30分】まとめ")
    print("  - ページ18: まとめ")
    print("  - チェックリストで復習")
    print("  - 質疑応答")
    print("  - フィードバック収集")
    print()
    print("=" * 60)
    print()
    
    # 操作ガイド
    print("🎮 講師操作ガイド")
    print("=" * 60)
    print()
    print("1. 上記の講師用URLをブラウザで開く")
    print("2. 右パネル「制御」タブで「同期ON」を確認")
    print("3. 受講者用URLを受講者全員に共有")
    print("4. 参加者が入室するのを待つ")
    print("5. ページ送りボタン（→）でスライドを進行")
    print("6. 注釈ツールで説明を補足")
    print("7. 重要ポイントカードで要点を強調")
    print("8. 講義終了後、フィードバックを収集")
    print()
    print("=" * 60)
    print()
    
    print("✅ 準備完了！")
    print("   講師用URLにアクセスして講義を開始してください。")
    print()

if __name__ == "__main__":
    main()

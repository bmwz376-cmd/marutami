"""
教材プラットフォーム設定
"""
import os
from pathlib import Path

# ベースディレクトリ
BASE_DIR = Path(__file__).parent.absolute()

# ストレージパス
STATIC_DIR = BASE_DIR / "static"
MATERIALS_DIR = STATIC_DIR / "materials"
UPLOADS_DIR = BASE_DIR / "uploads"

# 教材設定
MATERIAL_PAGE_MAX_WIDTH = 1400  # ページ画像の最大幅
MATERIAL_THUMB_WIDTH = 320      # サムネイル幅
MATERIAL_PAGE_FORMAT = "jpg"    # ページ画像フォーマット
MATERIAL_QUALITY = 90           # JPEG品質

# WebSocket設定
SOCKETIO_CORS_ALLOWED_ORIGINS = "*"  # 本番では制限すること

# Flask設定
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
DEBUG = os.environ.get("DEBUG", "True").lower() == "true"

# ディレクトリ作成
MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

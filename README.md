# 建築施工管理 教材プラットフォーム

Narukawa.co × NL-DG 建築基礎講座のためのWeb教材プラットフォーム

## 🎯 プロジェクト概要

**「PDF教材をWebに置く」ではなく、「現場教育をそのままWebに持ち込む」システム**

講師が主導し、受講者全員が同じ画面を同時に見ながら学べる、建設現場向け実務教育のための専用プラットフォームです。

### 対象教材

- ③仮設工事 (16ページ)
- ④山留工事 (20ページ)
- ⑤杭工事 (18ページ)
- ⑥掘削工事・山留支保工工事 (18ページ)
- ⑦躯体工事の流れと型枠工事 (23ページ)
- ⑧鉄筋工事１ (18ページ)
- ⑨鉄筋工事２ (18ページ)
- ⑩コンクリート工事１ (19ページ)
- ⑪コンクリート工事２改 (17ページ)

**合計167ページの教材を高品質画像化済み**

## ✨ 主要機能

### 講師モード

- **プレゼンターモード**: 講師がページを送ると、全受講者が同ページに自動同期
- **同期ON/OFF制御**: 受講者の自由閲覧モード切替
- **注釈ツール**:
  - ピン（指示点）
  - 図形（丸・四角）
  - フリーペン
  - レーザーポインタ（一時表示）
- **重要ポイントカード**: 配筋検査要点、打設確認などを全員に表示
- **講師ノート**: ページごとの教えるべきポイント表示

### 受講者モード

- **同期表示**: 講師と同じページを自動表示
- **用語パネル**: ページごとの専門用語と定義
- **チェックリスト**: 検査・確認項目の流れ
- **ノート閲覧**: 講師が公開したノートの表示

### ビューア機能

- **高解像度表示**: 図・写真が鮮明（JPEG 90%品質、最大幅1400px）
- **ズーム・パン**: Ctrl+ホイール、マウスドラッグ対応
- **キーボード操作**:
  - `→` / `Enter`: 次ページ
  - `←`: 前ページ
  - `+` / `-`: ズーム
  - `0`: フィット
- **サムネイルナビ**: クリック即ジャンプ

## 🏗 技術スタック

### バックエンド

- **Flask 3.0**: Pythonウェブフレームワーク
- **Flask-SocketIO 5.3**: WebSocketリアルタイム通信
- **PyMuPDF (fitz) 1.23**: PDF→画像変換（高速・高品質）

### フロントエンド

- **Vanilla JavaScript**: 軽量・高速
- **TailwindCSS**: CDN経由でスタイリング
- **Socket.IO Client 4.5**: WebSocket通信

### PDF処理

- **PyMuPDF**: 
  - 2倍解像度レンダリング
  - Pillow連携でリサイズ・最適化
  - サムネイル自動生成（320px幅）

## 📦 セットアップ

### 必要要件

- Python 3.10以上
- pip

### インストール

```bash
# 依存関係インストール
pip install -r requirements.txt

# 教材PDFを配置（初回のみ）
# /home/user/uploaded_files/*.pdf に配置

# PDF→画像変換実行
python scripts/convert_pdfs.py --user-uploads
```

### 起動

```bash
python app.py
```

アプリケーションが `http://localhost:5000` で起動します。

## 🚀 使い方

### 1. 教材一覧ページ

- `http://localhost:5000` にアクセス
- 教材カードから「講義ルーム作成」をクリック

### 2. 講義ルーム作成

- 講師用URLと受講者用URLが生成されます
- 講師用URLを講師に、受講者用URLを受講者に共有

### 3. 講義開始

**講師側**:
1. 講師用URLを開く
2. ページ送りで教材を進行
3. 注釈ツールで図にマーキング
4. 重要ポイントカードを表示

**受講者側**:
1. 受講者用URLを開く
2. 講師と同じページが自動表示される
3. 用語・チェックリストで学習
4. 講師が公開したノートを参照

### 4. WebSocket同期

- 講師のページ操作が1秒以内に全受講者に反映
- 途中参加者も現在状態に即復帰
- 切断時は自動再接続

## 📂 ディレクトリ構造

```
/home/user/webapp/
├── app.py                      # Flaskメインアプリ
├── config.py                   # 設定
├── requirements.txt            # Python依存関係
├── lib/
│   ├── pdf_processor.py       # PDF変換ロジック
│   └── room_manager.py        # ルーム状態管理
├── scripts/
│   └── convert_pdfs.py        # PDF一括変換スクリプト
├── static/
│   ├── materials/             # 変換済み教材
│   │   ├── manifest.json     # 全教材メタデータ
│   │   └── [教材ID]/
│   │       ├── metadata.json # 教材詳細メタ
│   │       ├── pages/        # ページ画像
│   │       └── thumbs/       # サムネイル
│   └── js/
│       ├── viewer.js         # ビューアコア
│       ├── sync.js           # WebSocket同期
│       └── instructor.js     # 講師ツール
└── templates/
    ├── index.html            # 教材一覧
    ├── instructor.html       # 講師画面
    ├── student.html          # 受講者画面
    └── admin.html            # 管理画面
```

## 🎓 教材メタデータ構造

各教材は以下の構造でメタデータを持ちます:

```json
{
  "id": "⑧鉄筋工事１",
  "title": "⑧鉄筋工事１",
  "category": "rebar",
  "total_pages": 18,
  "pages": [
    {
      "page_number": 1,
      "page_id": "001",
      "image_url": "/static/materials/.../pages/001.jpg",
      "thumbnail_url": "/static/materials/.../thumbs/001.jpg",
      "instructor_notes": [
        "鉄筋の基本用語を確認",
        "SD295A, SD345の違いを説明"
      ],
      "glossary": [
        {
          "term": "定着",
          "definition": "鉄筋をコンクリートに埋め込む長さ",
          "importance": "high"
        }
      ],
      "checklist": [
        {
          "text": "構造図を確認",
          "checked": false,
          "note": "配筋前に必ず実施"
        }
      ]
    }
  ]
}
```

## 🔧 開発

### PDF追加方法

```bash
# 1. PDFを uploads/ に配置
cp new_material.pdf uploads/

# 2. 変換実行
python scripts/convert_pdfs.py -f uploads/new_material.pdf

# 3. manifest.json更新
python scripts/convert_pdfs.py --all
```

### カスタマイズポイント

- **ページ画像最大幅**: `config.py` の `MATERIAL_PAGE_MAX_WIDTH`
- **サムネイル幅**: `config.py` の `MATERIAL_THUMB_WIDTH`
- **JPEG品質**: `config.py` の `MATERIAL_QUALITY`

## 📊 パフォーマンス

- **PDF変換速度**: 約37秒で全9教材（167ページ）変換
- **初期表示**: サムネイル即表示
- **ページ遷移**: <1秒
- **WebSocket同期**: <1秒で全員に配信

## 🚧 今後の拡張

### Phase 2 (予定)

- [ ] 図形注釈（矩形・円）の完全実装
- [ ] フリーペン描画
- [ ] ページメタデータ編集UI
- [ ] 用語・チェックリスト・ノートの実データ投入

### Phase 3 (予定)

- [ ] PDFアップロード完全実装
- [ ] ユーザー認証
- [ ] 講義履歴・録画
- [ ] S3互換ストレージ対応

## 📜 ライセンス

このプロジェクトはNarukawa.co × NL-DGの内部利用を目的としています。

## 👥 開発者

- **Backend & PDF処理**: Python (Flask + PyMuPDF)
- **Frontend & WebSocket**: JavaScript (Socket.IO)
- **教材提供**: Narukawa.co × NL-DG

---

**アクセスURL**: https://5000-io03tl6brmjjjtvbi4p77-0e616f0a.sandbox.novita.ai

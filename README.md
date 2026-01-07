# 建築施工管理 教材プラットフォーム

Web-based construction training material platform with real-time instructor synchronization.

## Overview

本プロジェクトは、Narukawa Co. × NL-DG Co., Ltd.が保有する建設現場向け実務教材PDFを、講師が主導し、受講者全員が同じ画面を同時に見ながら理解できる「施工管理・配筋検査・打設管理を教えるためのWeb教材プラットフォーム」です。

## Features

### 講師モード
- **リアルタイムページ同期**: 講師のページ操作を全受講者に即座に反映
- **注釈ツール**: ピン、図形、フリーペン、レーザーポインタ
- **重要ポイントカード**: 講義中に重要ポイントを全員に表示
- **同期制御**: ON/OFF切替で自由閲覧モードとの切替

### 受講者モード
- **自動同期**: 講師のページに自動追従
- **用語パネル**: ページごとの専門用語解説
- **チェックリスト**: 検査・確認項目の表示
- **途中参加対応**: 入室時に現在の状態に即復帰

### 対応教材
1. ③仮設工事
2. ④山留工事
3. ⑤杭工事
4. ⑥掘削工事・山留支保工工事
5. ⑦躯体工事の流れと型枠工事
6. ⑧鉄筋工事１
7. ⑨鉄筋工事２
8. ⑩コンクリート工事１
9. ⑪コンクリート工事２

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript
- **UI**: TailwindCSS
- **PDF Rendering**: pdf.js
- **Real-time Sync**: Socket.IO
- **State Management**: Zustand
- **Storage**: Local FS (PoC) → S3-compatible
- **Database**: JSON files (PoC) → PostgreSQL/SQLite

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Convert PDF materials (place PDFs in ./uploads first)
npm run convert-materials
```

### Development

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Socket.IO server
npm run socket-server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### PDF Material Conversion

1. Place PDF files in `./uploads/` directory
2. Run conversion script:
   ```bash
   npm run convert-materials
   ```
3. Images will be generated in `./public/materials/[materialId]/`

## Usage

### Creating a Lecture Room (Instructor)

1. Navigate to `/materials`
2. Select a material
3. Click "講義ルーム作成"
4. Share the room URL with students: `/room/[roomId]`
5. Use instructor URL: `/room/[roomId]?role=instructor`

### Joining a Room (Student)

1. Open the room URL provided by instructor
2. Automatically sync with instructor's page
3. View glossary, checklists, and annotations in real-time

## Project Structure

```
/home/user/webapp/
├── app/
│   ├── (instructor)/        # Instructor-only pages
│   ├── (student)/           # Student pages
│   ├── api/                 # API routes
│   └── page.tsx             # Home page
├── components/
│   ├── viewer/              # PDF viewer components
│   ├── instructor/          # Instructor tools
│   ├── student/             # Student UI
│   └── shared/              # Shared components
├── lib/
│   ├── pdf/                 # PDF conversion
│   ├── socket/              # WebSocket logic
│   ├── storage/             # File storage
│   └── db/                  # Database access
├── types/                   # TypeScript types
├── public/materials/        # Generated images
└── data/                    # JSON database
```

## License

Proprietary - Narukawa Co., Ltd. × NL-DG Co., Ltd.

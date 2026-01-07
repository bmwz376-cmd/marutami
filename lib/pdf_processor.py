"""
PDF処理モジュール - PyMuPDFを使用した高品質変換
"""
import fitz  # PyMuPDF
from pathlib import Path
from PIL import Image
import json
from typing import Dict, List, Tuple
import config


class PDFProcessor:
    """PDF→画像変換とメタデータ生成"""
    
    def __init__(self, pdf_path: str, material_id: str):
        """
        Args:
            pdf_path: PDFファイルパス
            material_id: 教材ID (ファイル名から生成)
        """
        self.pdf_path = Path(pdf_path)
        self.material_id = material_id
        self.output_dir = config.MATERIALS_DIR / material_id
        self.pages_dir = self.output_dir / "pages"
        self.thumbs_dir = self.output_dir / "thumbs"
        
    def convert(self) -> Dict:
        """
        PDF全ページを画像化し、メタデータを生成
        
        Returns:
            教材メタデータ辞書
        """
        # ディレクトリ作成
        self.pages_dir.mkdir(parents=True, exist_ok=True)
        self.thumbs_dir.mkdir(parents=True, exist_ok=True)
        
        # PDF読み込み
        doc = fitz.open(self.pdf_path)
        total_pages = len(doc)
        
        pages_metadata = []
        
        for page_num in range(total_pages):
            page = doc[page_num]
            page_id = f"{page_num + 1:03d}"
            
            # ページ画像生成 (高解像度)
            page_img_path = self.pages_dir / f"{page_id}.{config.MATERIAL_PAGE_FORMAT}"
            self._render_page(page, page_img_path, config.MATERIAL_PAGE_MAX_WIDTH)
            
            # サムネイル生成
            thumb_img_path = self.thumbs_dir / f"{page_id}.{config.MATERIAL_PAGE_FORMAT}"
            self._render_page(page, thumb_img_path, config.MATERIAL_THUMB_WIDTH)
            
            # ページメタデータ
            pages_metadata.append({
                "page_number": page_num + 1,
                "page_id": page_id,
                "image_url": f"/static/materials/{self.material_id}/pages/{page_id}.{config.MATERIAL_PAGE_FORMAT}",
                "thumbnail_url": f"/static/materials/{self.material_id}/thumbs/{page_id}.{config.MATERIAL_PAGE_FORMAT}",
                "instructor_notes": [],
                "glossary": [],
                "checklist": [],
                "highlights": []
            })
        
        doc.close()
        
        # 教材メタデータ
        material_metadata = {
            "id": self.material_id,
            "title": self.pdf_path.stem,
            "category": self._detect_category(self.pdf_path.stem),
            "total_pages": total_pages,
            "pages": pages_metadata,
            "chapters": []  # 後で手動追加
        }
        
        # メタデータ保存
        metadata_path = self.output_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(material_metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✓ 変換完了: {self.material_id} ({total_pages}ページ)")
        
        return material_metadata
    
    def _render_page(self, page: fitz.Page, output_path: Path, max_width: int):
        """ページを画像化"""
        # ズーム係数計算
        mat = fitz.Matrix(2.0, 2.0)  # 2倍解像度でレンダリング
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        # PIL Imageに変換
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # リサイズ
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # 保存
        img.save(output_path, quality=config.MATERIAL_QUALITY, optimize=True)
    
    def _detect_category(self, filename: str) -> str:
        """ファイル名からカテゴリ判定"""
        filename_lower = filename.lower()
        
        if "鉄筋" in filename:
            return "rebar"
        elif "コンクリート" in filename:
            return "concrete"
        elif "仮設" in filename:
            return "temporary"
        elif "山留" in filename:
            return "retaining"
        elif "杭" in filename:
            return "pile"
        elif "掘削" in filename:
            return "excavation"
        elif "躯体" in filename or "型枠" in filename:
            return "framework"
        else:
            return "general"


def generate_manifest(materials_dir: Path) -> Dict:
    """
    全教材のmanifest.jsonを生成
    
    Args:
        materials_dir: 教材ディレクトリ
        
    Returns:
        manifest辞書
    """
    manifest = {
        "version": "1.0",
        "materials": []
    }
    
    for material_dir in materials_dir.iterdir():
        if not material_dir.is_dir():
            continue
            
        metadata_path = material_dir / "metadata.json"
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                metadata = json.load(f)
                manifest["materials"].append({
                    "id": metadata["id"],
                    "title": metadata["title"],
                    "category": metadata["category"],
                    "total_pages": metadata["total_pages"]
                })
    
    # manifest.json保存
    manifest_path = materials_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Manifest生成完了: {len(manifest['materials'])}教材")
    
    return manifest

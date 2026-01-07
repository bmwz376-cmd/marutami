"""
PDF変換スクリプト - アップロードされたPDFを教材資産に変換
"""
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from lib.pdf_processor import PDFProcessor, generate_manifest


def convert_pdf(pdf_path: str) -> dict:
    """
    単一PDFを変換
    
    Args:
        pdf_path: PDFファイルパス
        
    Returns:
        教材メタデータ
    """
    pdf_file = Path(pdf_path)
    
    if not pdf_file.exists():
        raise FileNotFoundError(f"PDFが見つかりません: {pdf_path}")
    
    # 教材ID生成 (ファイル名から)
    material_id = pdf_file.stem.replace(" ", "_").replace("(", "").replace(")", "")
    
    # 変換実行
    processor = PDFProcessor(pdf_path, material_id)
    metadata = processor.convert()
    
    return metadata


def convert_all_uploaded_pdfs():
    """uploads/内の全PDFを変換"""
    uploads_dir = config.UPLOADS_DIR
    
    if not uploads_dir.exists():
        print(f"アップロードディレクトリが見つかりません: {uploads_dir}")
        return
    
    pdf_files = list(uploads_dir.glob("*.pdf"))
    
    if not pdf_files:
        print("PDFファイルが見つかりません")
        return
    
    print(f"=== PDF変換開始: {len(pdf_files)}ファイル ===\n")
    
    for pdf_file in pdf_files:
        try:
            print(f"処理中: {pdf_file.name}")
            convert_pdf(str(pdf_file))
            print()
        except Exception as e:
            print(f"エラー: {pdf_file.name} - {e}\n")
            continue
    
    # manifest.json生成
    print("=== Manifest生成 ===")
    generate_manifest(config.MATERIALS_DIR)
    
    print("\n=== 変換完了 ===")


def convert_user_uploaded_files():
    """
    /home/user/uploaded_files/ 内のPDFを変換
    (ユーザーがアップロードした教材PDFの初回変換用)
    """
    source_dir = Path("/home/user/uploaded_files")
    
    if not source_dir.exists():
        print("uploaded_filesディレクトリが見つかりません")
        return
    
    pdf_files = list(source_dir.glob("*.pdf"))
    
    if not pdf_files:
        print("PDFファイルが見つかりません")
        return
    
    print(f"=== ユーザーアップロードPDF変換開始: {len(pdf_files)}ファイル ===\n")
    
    for pdf_file in pdf_files:
        try:
            print(f"処理中: {pdf_file.name}")
            convert_pdf(str(pdf_file))
            print()
        except Exception as e:
            print(f"エラー: {pdf_file.name} - {e}\n")
            continue
    
    # manifest.json生成
    print("=== Manifest生成 ===")
    generate_manifest(config.MATERIALS_DIR)
    
    print("\n=== 変換完了 ===")
    print(f"教材ディレクトリ: {config.MATERIALS_DIR}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="PDF教材変換スクリプト")
    parser.add_argument("--file", "-f", help="変換するPDFファイルパス")
    parser.add_argument("--all", "-a", action="store_true", help="uploads/内の全PDF変換")
    parser.add_argument("--user-uploads", "-u", action="store_true", help="/home/user/uploaded_files/内の全PDF変換")
    
    args = parser.parse_args()
    
    if args.file:
        convert_pdf(args.file)
        generate_manifest(config.MATERIALS_DIR)
    elif args.user_uploads:
        convert_user_uploaded_files()
    elif args.all:
        convert_all_uploaded_pdfs()
    else:
        print("使用方法:")
        print("  単一ファイル: python convert_pdfs.py -f path/to/file.pdf")
        print("  全ファイル: python convert_pdfs.py -a")
        print("  ユーザーアップロード: python convert_pdfs.py -u")

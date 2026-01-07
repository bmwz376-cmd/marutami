#!/usr/bin/env tsx

import { PDFConverter } from '../lib/pdf/converter-cli';
import { storage } from '../lib/storage/local';
import { db } from '../lib/db/database';
import type { Material, MaterialCategory } from '../types/material';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';

// Mapping of PDF filenames to categories
const MATERIAL_CATEGORIES: Record<string, { category: MaterialCategory; title: string }> = {
  '③仮設工事.pdf': { category: 'temporary', title: '③仮設工事' },
  '⓸山留工事.pdf': { category: 'retention', title: '④山留工事' },
  '⑤杭工事.pdf': { category: 'pile', title: '⑤杭工事' },
  '⑥掘削工事・山留支保工工事.pdf': { category: 'excavation', title: '⑥掘削工事・山留支保工工事' },
  '⑦躯体工事の流れと型枠工事.pdf': { category: 'framework', title: '⑦躯体工事の流れと型枠工事' },
  '⑧鉄筋工事１.pdf': { category: 'rebar', title: '⑧鉄筋工事１' },
  '⑨鉄筋工事２.pdf': { category: 'rebar', title: '⑨鉄筋工事２' },
  '⑩コンクリート工事１.pdf': { category: 'concrete', title: '⑩コンクリート工事１' },
  '⑪コンクリート工事２改.pdf': { category: 'concrete', title: '⑪コンクリート工事２' },
};

async function convertMaterials() {
  console.log('🚀 Starting PDF material conversion...\n');

  // Initialize database
  await db.init();
  console.log('✓ Database initialized\n');

  // Find PDFs from uploaded files
  const uploadedFilesDir = '/home/user/uploaded_files';
  let pdfFiles: string[] = [];
  
  try {
    const files = await fs.readdir(uploadedFilesDir);
    pdfFiles = files.filter(f => f.endsWith('.pdf'));
    console.log(`Found ${pdfFiles.length} PDF files in ${uploadedFilesDir}\n`);
  } catch (error) {
    console.error(`Error reading uploaded files directory: ${error}`);
    return;
  }

  if (pdfFiles.length === 0) {
    console.log('No PDF files found. Please place PDFs in /home/user/uploaded_files/');
    return;
  }

  const converter = new PDFConverter({
    dpi: 150, // High resolution (2x)
    format: 'png',
    quality: 90,
  });

  // Convert each PDF
  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(uploadedFilesDir, pdfFile);
    const categoryInfo = MATERIAL_CATEGORIES[pdfFile];

    if (!categoryInfo) {
      console.log(`⚠️  Skipping ${pdfFile} (not in category mapping)\n`);
      continue;
    }

    console.log(`📄 Processing: ${categoryInfo.title}`);
    console.log(`   Category: ${categoryInfo.category}`);
    console.log(`   File: ${pdfFile}`);

    try {
      // Generate material ID
      const materialId = nanoid(10);
      const outputDir = path.join(process.cwd(), 'public', 'materials', materialId);

      // Convert PDF to images
      const result = await converter.convertPDF(pdfPath, outputDir, (progress) => {
        if (progress.status === 'processing') {
          process.stdout.write(`\r   Converting: ${progress.currentPage}/${progress.totalPages} pages`);
        }
      });

      console.log('\n   ✓ Conversion completed');
      console.log(`   Total pages: ${result.totalPages}`);
      console.log(`   Images: ${result.imageDir}`);
      console.log(`   Thumbnails: ${result.thumbnailDir}`);

      // Create material metadata
      const material: Material = {
        id: materialId,
        title: categoryInfo.title,
        category: categoryInfo.category,
        pdfFileName: pdfFile,
        totalPages: result.totalPages,
        chapters: [
          {
            id: nanoid(10),
            title: categoryInfo.title,
            order: 1,
            startPage: 1,
            endPage: result.totalPages,
            pages: Array.from({ length: result.totalPages }, (_, i) => {
              const pageNum = i + 1;
              return {
                id: nanoid(10),
                pageNumber: pageNum,
                imageUrl: `/materials/${materialId}/pages/${String(pageNum).padStart(3, '0')}.png`,
                thumbnailUrl: `/materials/${materialId}/thumbnails/${String(pageNum).padStart(3, '0')}.png`,
                instructorNotes: [],
                glossary: [],
                checklist: [],
                highlights: [],
              };
            }),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save to database
      await db.saveMaterial(material);
      console.log(`   ✓ Saved to database (ID: ${materialId})\n`);
    } catch (error) {
      console.error(`   ✗ Error: ${error}\n`);
    }
  }

  console.log('🎉 All materials processed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run dev');
  console.log('2. Visit: http://localhost:3000/materials');
  console.log('3. Create a lecture room and start teaching!\n');
}

// Run the conversion
convertMaterials().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

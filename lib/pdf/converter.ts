import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// PDF.js doesn't need worker in Node.js environment
// Set to empty string to disable worker
if (typeof pdfjsLib.GlobalWorkerOptions !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'null';
}

export type ConversionOptions = {
  pageScale: number; // DPI scaling factor (2.0 = 144 DPI)
  thumbnailScale: number; // Thumbnail size scale
  quality: number; // JPEG quality (0-100)
  format: 'png' | 'jpg';
};

const DEFAULT_OPTIONS: ConversionOptions = {
  pageScale: 2.0, // High resolution for zooming
  thumbnailScale: 0.25, // 25% of original size
  quality: 90,
  format: 'png',
};

export type ConversionProgress = {
  currentPage: number;
  totalPages: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
};

export class PDFConverter {
  private options: ConversionOptions;

  constructor(options: Partial<ConversionOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Convert a PDF file to page images
   */
  async convertPDF(
    pdfPath: string,
    outputDir: string,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<{ totalPages: number; imageDir: string; thumbnailDir: string }> {
    try {
      // Load PDF
      const buffer = await fs.readFile(pdfPath);
      const data = new Uint8Array(buffer);
      
      // Disable worker for server-side rendering
      const loadingTask = pdfjsLib.getDocument({
        data,
        verbosity: 0,
        isEvalSupported: false,
        useWorkerFetch: false,
        useSystemFonts: true,
      });
      
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      // Create output directories
      const imageDir = path.join(outputDir, 'pages');
      const thumbnailDir = path.join(outputDir, 'thumbnails');
      await fs.mkdir(imageDir, { recursive: true });
      await fs.mkdir(thumbnailDir, { recursive: true });

      // Convert each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress?.({
          currentPage: pageNum,
          totalPages,
          status: 'processing',
          message: `Converting page ${pageNum}/${totalPages}`,
        });

        const page = await pdf.getPage(pageNum);
        
        // Render full-size image
        const imagePath = path.join(imageDir, `${String(pageNum).padStart(3, '0')}.${this.options.format}`);
        await this.renderPage(page, imagePath, this.options.pageScale);

        // Render thumbnail
        const thumbnailPath = path.join(thumbnailDir, `${String(pageNum).padStart(3, '0')}.${this.options.format}`);
        await this.renderPage(page, thumbnailPath, this.options.thumbnailScale);

        page.cleanup();
      }

      pdf.destroy();

      onProgress?.({
        currentPage: totalPages,
        totalPages,
        status: 'completed',
        message: 'Conversion completed successfully',
      });

      return { totalPages, imageDir, thumbnailDir };
    } catch (error) {
      onProgress?.({
        currentPage: 0,
        totalPages: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Render a single page to an image file
   */
  private async renderPage(
    page: any,
    outputPath: string,
    scale: number
  ): Promise<void> {
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');

    // Process with sharp (optimize and convert if needed)
    let image = sharp(buffer);

    if (this.options.format === 'jpg') {
      image = image.jpeg({ quality: this.options.quality });
    } else {
      image = image.png({ compressionLevel: 9 });
    }

    // Save to file
    await image.toFile(outputPath);
  }

  /**
   * Get PDF metadata
   */
  async getPDFMetadata(pdfPath: string): Promise<{
    totalPages: number;
    title?: string;
    author?: string;
    subject?: string;
  }> {
    const buffer = await fs.readFile(pdfPath);
    const data = new Uint8Array(buffer);
    
    const loadingTask = pdfjsLib.getDocument({
      data,
      verbosity: 0,
      isEvalSupported: false,
      useWorkerFetch: false,
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    const metadata = await pdf.getMetadata();
    const totalPages = pdf.numPages;

    pdf.destroy();

    return {
      totalPages,
      title: metadata.info?.Title,
      author: metadata.info?.Author,
      subject: metadata.info?.Subject,
    };
  }
}

import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export type ConversionOptions = {
  dpi: number; // Resolution (144 = 2x, 72 = 1x)
  format: 'png' | 'jpeg';
  quality: number; // For JPEG only
};

const DEFAULT_OPTIONS: ConversionOptions = {
  dpi: 150, // High resolution for zoom
  format: 'png',
  quality: 90,
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
   * Convert a PDF file to page images using poppler's pdftoppm
   */
  async convertPDF(
    pdfPath: string,
    outputDir: string,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<{ totalPages: number; imageDir: string; thumbnailDir: string }> {
    try {
      // Get PDF page count first
      const { stdout: infoOutput } = await execAsync(`pdfinfo "${pdfPath}"`);
      const pagesMatch = infoOutput.match(/Pages:\s+(\d+)/);
      const totalPages = pagesMatch ? parseInt(pagesMatch[1], 10) : 0;

      if (totalPages === 0) {
        throw new Error('Could not determine PDF page count');
      }

      onProgress?.({
        currentPage: 0,
        totalPages,
        status: 'processing',
        message: `Starting conversion of ${totalPages} pages`,
      });

      // Create output directories
      const imageDir = path.join(outputDir, 'pages');
      const thumbnailDir = path.join(outputDir, 'thumbnails');
      const tempDir = path.join(outputDir, 'temp');
      
      await fs.mkdir(imageDir, { recursive: true });
      await fs.mkdir(thumbnailDir, { recursive: true });
      await fs.mkdir(tempDir, { recursive: true });

      // Convert all pages using pdftoppm
      // -png: PNG format
      // -r {dpi}: Resolution
      // -singlefile not used - we want all pages
      const outputPrefix = path.join(tempDir, 'page');
      await execAsync(
        `pdftoppm -png -r ${this.options.dpi} "${pdfPath}" "${outputPrefix}"`
      );

      // Get all generated files
      const tempFiles = await fs.readdir(tempDir);
      const pageFiles = tempFiles
        .filter(f => f.startsWith('page-') && f.endsWith('.png'))
        .sort();

      // Process each page
      for (let i = 0; i < pageFiles.length; i++) {
        const pageNum = i + 1;
        const tempFile = path.join(tempDir, pageFiles[i]);
        const outputFile = path.join(imageDir, `${String(pageNum).padStart(3, '0')}.png`);
        const thumbnailFile = path.join(thumbnailDir, `${String(pageNum).padStart(3, '0')}.png`);

        onProgress?.({
          currentPage: pageNum,
          totalPages,
          status: 'processing',
          message: `Processing page ${pageNum}/${totalPages}`,
        });

        // Optimize and move full-size image
        await sharp(tempFile)
          .png({ compressionLevel: 9, quality: 100 })
          .toFile(outputFile);

        // Create thumbnail (25% of original size)
        const metadata = await sharp(tempFile).metadata();
        const thumbWidth = Math.round((metadata.width || 1000) * 0.25);

        await sharp(tempFile)
          .resize(thumbWidth)
          .png({ compressionLevel: 9 })
          .toFile(thumbnailFile);

        // Clean up temp file
        await fs.unlink(tempFile);
      }

      // Clean up temp directory
      await fs.rmdir(tempDir);

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
   * Get PDF metadata using pdfinfo
   */
  async getPDFMetadata(pdfPath: string): Promise<{
    totalPages: number;
    title?: string;
    author?: string;
    subject?: string;
  }> {
    const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
    
    const pagesMatch = stdout.match(/Pages:\s+(\d+)/);
    const titleMatch = stdout.match(/Title:\s+(.+)/);
    const authorMatch = stdout.match(/Author:\s+(.+)/);
    const subjectMatch = stdout.match(/Subject:\s+(.+)/);

    return {
      totalPages: pagesMatch ? parseInt(pagesMatch[1], 10) : 0,
      title: titleMatch ? titleMatch[1].trim() : undefined,
      author: authorMatch ? authorMatch[1].trim() : undefined,
      subject: subjectMatch ? subjectMatch[1].trim() : undefined,
    };
  }
}

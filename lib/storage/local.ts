import fs from 'fs/promises';
import path from 'path';

// Local file system storage for PoC
// Later can be abstracted to S3-compatible storage

export class LocalStorage {
  private basePath: string;

  constructor(basePath: string = path.join(process.cwd(), 'public', 'materials')) {
    this.basePath = basePath;
  }

  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = path.join(this.basePath, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  async writeFile(filePath: string, data: Buffer): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.writeFile(fullPath, data);
  }

  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.readFile(fullPath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath);
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const fullPath = path.join(this.basePath, dirPath);
    return await fs.readdir(fullPath);
  }

  getPublicUrl(filePath: string): string {
    // Returns URL path relative to public directory
    return `/materials/${filePath}`;
  }

  getFullPath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }
}

export const storage = new LocalStorage();

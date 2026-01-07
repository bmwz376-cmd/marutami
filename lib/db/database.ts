import fs from 'fs/promises';
import path from 'path';
import type { Material, MaterialMetadata } from '@/types/material';
import type { Room } from '@/types/room';

// Simple JSON file-based database for PoC
// Later can be replaced with proper database (SQLite/PostgreSQL)

const DB_DIR = path.join(process.cwd(), 'data');
const MATERIALS_FILE = path.join(DB_DIR, 'materials.json');
const METADATA_DIR = path.join(DB_DIR, 'metadata');
const ROOMS_FILE = path.join(DB_DIR, 'rooms.json');

class Database {
  async init(): Promise<void> {
    await fs.mkdir(DB_DIR, { recursive: true });
    await fs.mkdir(METADATA_DIR, { recursive: true });
    
    // Initialize files if they don't exist
    if (!await this.fileExists(MATERIALS_FILE)) {
      await fs.writeFile(MATERIALS_FILE, JSON.stringify([], null, 2));
    }
    if (!await this.fileExists(ROOMS_FILE)) {
      await fs.writeFile(ROOMS_FILE, JSON.stringify([], null, 2));
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    const content = await fs.readFile(MATERIALS_FILE, 'utf-8');
    return JSON.parse(content);
  }

  async getMaterial(id: string): Promise<Material | null> {
    const materials = await this.getMaterials();
    return materials.find(m => m.id === id) || null;
  }

  async saveMaterial(material: Material): Promise<void> {
    const materials = await this.getMaterials();
    const index = materials.findIndex(m => m.id === material.id);
    
    if (index >= 0) {
      materials[index] = material;
    } else {
      materials.push(material);
    }
    
    await fs.writeFile(MATERIALS_FILE, JSON.stringify(materials, null, 2));
  }

  async deleteMaterial(id: string): Promise<void> {
    const materials = await this.getMaterials();
    const filtered = materials.filter(m => m.id !== id);
    await fs.writeFile(MATERIALS_FILE, JSON.stringify(filtered, null, 2));
  }

  // Material Metadata
  async getMetadata(materialId: string): Promise<MaterialMetadata | null> {
    const metadataFile = path.join(METADATA_DIR, `${materialId}.json`);
    
    if (!await this.fileExists(metadataFile)) {
      return null;
    }
    
    const content = await fs.readFile(metadataFile, 'utf-8');
    return JSON.parse(content);
  }

  async saveMetadata(metadata: MaterialMetadata): Promise<void> {
    const metadataFile = path.join(METADATA_DIR, `${metadata.materialId}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  }

  // Rooms
  async getRooms(): Promise<Room[]> {
    const content = await fs.readFile(ROOMS_FILE, 'utf-8');
    return JSON.parse(content);
  }

  async getRoom(id: string): Promise<Room | null> {
    const rooms = await this.getRooms();
    return rooms.find(r => r.id === id) || null;
  }

  async saveRoom(room: Room): Promise<void> {
    const rooms = await this.getRooms();
    const index = rooms.findIndex(r => r.id === room.id);
    
    if (index >= 0) {
      rooms[index] = room;
    } else {
      rooms.push(room);
    }
    
    await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2));
  }

  async deleteRoom(id: string): Promise<void> {
    const rooms = await this.getRooms();
    const filtered = rooms.filter(r => r.id !== id);
    await fs.writeFile(ROOMS_FILE, JSON.stringify(filtered, null, 2));
  }
}

export const db = new Database();

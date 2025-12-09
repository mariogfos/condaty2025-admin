// src/mk/services/storage/storage.service.ts
import { CloudinaryAdapter } from './adapters/CloudinaryAdapter';
import type { StorageFile, IStorageAdapter } from './types';

// Configuración de Cloudinary - ajustar según tu config
const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  folder: process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || 'condaty-admin',
};

class StorageService {
  private adapter: IStorageAdapter;

  constructor() {
    this.adapter = new CloudinaryAdapter(cloudinaryConfig);
  }

  async upload(file: File, path: string): Promise<StorageFile> {
    return this.adapter.upload(file, path);
  }

  async delete(file: StorageFile): Promise<void> {
    return this.adapter.delete(file);
  }

  url(path: string): string {
    return this.adapter.url(path);
  }
}

export const storage = new StorageService();
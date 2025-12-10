// src/mk/services/storage/adapters/CloudinaryAdapter.ts
import { IStorageAdapter, StorageFile } from '../types';

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
}

export class CloudinaryAdapter implements IStorageAdapter {
  private cloudName: string;
  private uploadPreset: string;
  private folder: string;

  constructor(config: CloudinaryConfig) {
    this.cloudName = config.cloudName;
    this.uploadPreset = config.uploadPreset;
    this.folder = config.folder || 'condaty-admin';
  }

  async upload(file: File, path: string): Promise<StorageFile> {
    try {
      const filename = path.split('/').pop() || 'file.jpg';
      const publicId = path.replace(/\.[^/.]+$/, ''); // sin extensión

      // Convertir File a base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', base64Data);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', this.folder);
      formData.append('public_id', publicId);
      
      // Determinar el resource_type correcto
      let resourceType = 'raw'; // Por defecto para documentos, PDFs, etc.
      if (file.type.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.type.startsWith('video/')) {
        resourceType = 'video';
      }
      // PDFs y documentos quedan como 'raw'

      console.log('📤 Subiendo a Cloudinary:', { publicId, filename, resourceType, mimeType: file.type });

      // IMPORTANTE: Usar el endpoint específico del tipo de recurso
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Cloudinary error:', data);
        throw new Error(data.error?.message || 'Error al subir archivo a Cloudinary');
      }

      console.log('✅ Cloudinary upload exitoso:', data.secure_url, 'resource_type:', data.resource_type);

      // Retornamos el formato esperado
      return {
        path: data.public_id,
        url: data.secure_url,
        name: data.original_filename || filename,
        resource_type: data.resource_type || resourceType,
      };
    } catch (error) {
      console.error('💥 CloudinaryAdapter upload error:', error);
      throw error;
    }
  }

  async delete(file: StorageFile): Promise<void> {
    try {
      // El path ya contiene el public_id de Cloudinary
      const publicId = file.path;

      console.log('🗑️ Eliminando de Cloudinary:', publicId);

      // Llamar al endpoint de Next.js para borrar (asumiendo que existe)
      const response = await fetch('/api/cloudinary-upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: publicId }),
      });

      if (!response.ok) {
        console.warn('No se pudo eliminar de Cloudinary:', publicId);
      }
    } catch (error) {
      console.error('CloudinaryAdapter delete error:', error);
      // No lanzamos error para no bloquear la UI
    }
  }

  url(pathOrUrl: string): string {
    // Si ya es una URL completa, retornarla
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      return pathOrUrl;
    }

    // Detectar el tipo de recurso por la extensión del archivo
    const ext = pathOrUrl.split('.').pop()?.toLowerCase();
    let resourceType = 'raw';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    
    if (ext && imageExts.includes(ext)) {
      resourceType = 'image';
    } else if (ext && videoExts.includes(ext)) {
      resourceType = 'video';
    }
    // PDFs, docs, etc. quedan como 'raw'

    const publicId = pathOrUrl.replace(/\.[^/.]+$/, ''); // sin extensión
    return `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/${publicId}`;
  }
}
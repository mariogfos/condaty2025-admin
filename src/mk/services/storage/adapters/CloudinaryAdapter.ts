import { IStorageAdapter, StorageFile } from "../types";

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
    this.folder = config.folder || "condaty-admin";
  }

  async upload(file: File, path: string): Promise<StorageFile> {
    // Detectar tipo REAL
    const isImage = file.type.startsWith("image/");
    // const resourceType = isImage ? "image" : "raw";
    const resourceType = isImage ? "image" : "raw";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", isImage ? this.uploadPreset : "docfiles2");
    formData.append("folder", this.folder);
    // 🔑 IMPORTANTE: conservar extensión para documentos
    formData.append("public_id", path);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Error subiendo archivo a Cloudinary"
      );
    }

    return {
      path: data.public_id, // incluye extensión
      url: data.secure_url, // URL REAL del archivo
      name: data.original_filename || file.name,
      resource_type: data.resource_type, // image | raw
    };
  }

  async delete(file: StorageFile): Promise<void> {
    try {
      const response = await fetch("/api/cloudinary-upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: file.path,
          resource_type: file.resource_type || "raw",
        }),
      });

      if (!response.ok) {
        console.warn("No se pudo eliminar:", file.path);
      }
    } catch (error) {
      console.error("Cloudinary delete error:", error);
    }
  }

  url(pathOrUrl: string): string {
    // Si ya es URL completa, devuélvela
    if (pathOrUrl.startsWith("http")) {
      return pathOrUrl;
    }

    // Detectar extensión
    const ext = pathOrUrl.split(".").pop()?.toLowerCase();

    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    const videoExts = ["mp4", "mov", "avi", "mkv", "webm"];

    let resourceType: "image" | "video" | "raw" = "raw";

    if (ext && imageExts.includes(ext)) resourceType = "image";
    else if (ext && videoExts.includes(ext)) resourceType = "video";

    return `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/${pathOrUrl}`;
  }
}

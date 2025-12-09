export type StorageFile = {
  path: string;     // ej: "12345/incidents/1735689123_foto.jpg"
  url: string;      // ej: "https://res.cloudinary.com/.../image/upload/v.../public_id"
  name: string;
};

export interface IStorageAdapter {
  upload(file: File, path: string): Promise<StorageFile>;
  delete(file: StorageFile): Promise<void>;
  url(path: string): string;
}
export interface IUploadAdapter {
  upload(
    file: File,
    context: { prefix: string; global: boolean }
  ): Promise<string>;
  delete(url: string): Promise<boolean>;
}

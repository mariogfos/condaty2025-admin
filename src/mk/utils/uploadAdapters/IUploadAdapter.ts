export interface IUploadAdapter {
  upload(
    file: File,
    context: { prefix: string; global: boolean }
  ): Promise<string>;
}

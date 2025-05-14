export interface FileStorageService {
  uploadFile(buffer: Buffer, filename: string, mimetype: string) : Promise<string>;
  downloadFile(filePathOrUrl: string): Promise<Buffer>;
  deleteFile(filePathOrUrl: string): Promise<void>;
}
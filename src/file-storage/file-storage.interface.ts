export interface StoredFileDetails {
  storedFileName: string;
  storedFilePath: string;
}

export interface FileStorageService {
  uploadFile(buffer: Buffer, filename: string, mimetype: string) : Promise<StoredFileDetails>;
  downloadFile(filePathOrUrl: string): Promise<Buffer>;
  deleteFile(filePathOrUrl: string): Promise<void>;
  getStorageDetails(): any;
}
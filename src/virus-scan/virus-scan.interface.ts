export interface VirusScanService {
  scanNow(buffer: Buffer): Promise<void>;  // throws if virus detected
  queueScan(fileId: string, filePathOrUrl: string): Promise<void>;
}
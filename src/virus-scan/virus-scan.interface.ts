export interface VirusScanService {
  shallowScan(buffer: Buffer): Promise<void>;  // throws if virus detected
  queueDeepScan(fileId: string, filePathOrUrl: string): Promise<void>;
}
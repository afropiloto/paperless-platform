// virus-scan.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { DEEP_VIRUS_SCAN_QUEUE_NAME } from '../constants/app.constants';
import { VirusScanService } from './virus-scan.interface';
import { VIRUS_SCAN_SERVICE } from './virus-scan.constants';

@Processor(DEEP_VIRUS_SCAN_QUEUE_NAME)
export class VirusScanProcessor extends WorkerHost {
  private readonly logger = new Logger(VirusScanProcessor.name);
  constructor(
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorage: FileStorageService,
    @Inject(VIRUS_SCAN_SERVICE)
    private readonly virusScanService: VirusScanService
  ) {super()}

  async process(job: Job<{ fileId: string; filePathOrUrl: string }>) {
    const { filePathOrUrl } = job.data;

    // Obtain the file
    const fileBuffer = await this.fileStorage.downloadFile(filePathOrUrl);



  }
}

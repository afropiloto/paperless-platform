import { Module } from '@nestjs/common';
import { ClamAvVirusScanService } from './claimav-virus-scan.service';
import { BullModule } from '@nestjs/bullmq';
import { VIRUS_SCAN_SERVICE } from './virus-scan.constants';
import { VirusScanProcessor } from './virus-scan.processor';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    FileStorageModule,
    BullModule.registerQueue({ name: 'virus-scan' })
  ],
  providers: [
    {
      provide: VIRUS_SCAN_SERVICE,
      useClass: ClamAvVirusScanService,
    },
    ClamAvVirusScanService,
    VirusScanProcessor,
  ],
  exports:[VIRUS_SCAN_SERVICE]
})
export class VirusScanModule {}

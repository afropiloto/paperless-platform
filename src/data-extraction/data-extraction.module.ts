import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DATA_EXTRACTION_QUEUE_NAME } from '../constants/app.constants';
import { ConfigModule } from '@nestjs/config';
import { DataExtractionService } from './data-extraction.service';
import { DataExtractionProcessor } from './data-extraction.processor';
import { AuditModule } from '../audit/audit.module';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    BullModule.registerQueue({name: DATA_EXTRACTION_QUEUE_NAME}),
    ConfigModule,
    TradeDocumentsModule,
    AuditModule,
    FileStorageModule
  ],
  providers: [DataExtractionService, DataExtractionProcessor]
})
export class DataExtractionModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DATA_EXTRACTION_QUEUE_NAME } from '../constants/app.constants';
import { ConfigModule } from '@nestjs/config';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { AuditModule } from '../audit/audit.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { DataExtractionExtendAiProcessor } from './data-extraction-extend-ai.processor';
import { ShareLinksModule } from '../share-links/share-links.module';

@Module({
  imports: [
    BullModule.registerQueue({name: DATA_EXTRACTION_QUEUE_NAME}),
    ConfigModule,
    TradeDocumentsModule,
    AuditModule,
    FileStorageModule,
    ShareLinksModule
  ],
  providers: [DataExtractionExtendAiProcessor]
})
export class DataExtractionEventsModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CREATE_DOCUMENT_SIGNING_EVENT_QUEUE } from '../constants/app.constants';
import { DocumentSigningModule } from '../document-signing/document-signing.module';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { AuditModule } from '../audit/audit.module';
import { CreateDocumentSigningEventProcessor } from './create-signing-event.processor';

@Module({
  imports:[
    BullModule.registerQueue({name: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE}),
    DocumentSigningModule,
    TradeDocumentsModule,
    AuditModule,
    FileStorageModule
  ],
  providers: [CreateDocumentSigningEventProcessor],
  exports: [CreateDocumentSigningEventProcessor]
})
export class DocumentSigningEventsModule {}

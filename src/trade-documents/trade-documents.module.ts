import { Module } from '@nestjs/common';
import { TradeDocumentsController } from './trade-documents.controller';
import { TradeDocumentsService } from './trade-documents.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeDocument, TradeDocumentSchema } from './schema/trade-document.schema';
import { BullModule } from '@nestjs/bullmq';
import { DATA_EXTRACTION_QUEUE_NAME } from '../constants/app.constants';
import { TradeDocumentsRepository } from './trade-documents.repository';
import { AccountsModule } from '../accounts/accounts.module';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TradeDocument.name, schema: TradeDocumentSchema }]),
    BullModule.registerQueue({name: DATA_EXTRACTION_QUEUE_NAME}),
    AccountsModule,
    FileStorageModule,
  ],
  controllers: [TradeDocumentsController],
  providers: [TradeDocumentsService, TradeDocumentsRepository],
  exports: [TradeDocumentsService]
})
export class TradeDocumentsModule {}

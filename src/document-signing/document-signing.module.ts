import { Module } from '@nestjs/common';
import { DocumentSigningService } from './document-signing.service';
import { DocumentSigningController } from './document-signing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentSigning, DocumentSigningSchema } from './schemas/document-signing.schema';
import { DocumentSigningRepository } from './document-signing.repository';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { BullModule } from '@nestjs/bullmq';
import {
  CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
  SIGN_DOCUMENT_ON_BEHALF_QUEUE,
} from '../constants/app.constants';
import { DocumentSigningContractService } from './document-signing-contract.service';

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: DocumentSigning.name, schema: DocumentSigningSchema },
      ]),
    BullModule.registerQueue(
      { name: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE },
      { name: SIGN_DOCUMENT_ON_BEHALF_QUEUE },
    ),
    BullModule.registerFlowProducer({
      name: 'create-signing-event'
    }),
    TradeDocumentsModule,
  ],
  providers: [DocumentSigningService, DocumentSigningContractService, DocumentSigningRepository],
  controllers: [DocumentSigningController],
  exports: [DocumentSigningService, DocumentSigningContractService]
})
export class DocumentSigningModule {}

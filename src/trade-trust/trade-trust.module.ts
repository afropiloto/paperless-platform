import { Module } from '@nestjs/common';
import { TradeTrustService } from './trade-trust.service';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';
import { TRADE_TRUST_QUEUE_NAME } from '../constants/app.constants';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TradeTrustProcessor } from './trade-trust.processor';
import { TradeDocumentsRepository } from '../trade-documents/trade-documents.repository';
import { AuditModule } from '../audit/audit.module';


@Module({

  imports: [
    MongooseModule.forFeature([{ name: TradeDocument.name, schema: TradeDocumentSchema }]),
    BullModule.registerQueue({name: TRADE_TRUST_QUEUE_NAME}),
    ConfigModule,
    AuditModule,
  ],
  providers: [TradeTrustService, TradeTrustProcessor, TradeDocumentsRepository]

})
export class TradeTrustModule {}

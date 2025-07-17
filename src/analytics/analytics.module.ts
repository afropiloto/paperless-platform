import { Module } from '@nestjs/common';
import { TradeFinance, TradeFinanceSchema } from '../trade-finance/schemas/trade-finance.schema';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { TradeFinanceModule } from '../trade-finance/tradeFinanceModule';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradeDocument.name, schema: TradeDocumentSchema },
      { name: TradeFinance.name, schema: TradeFinanceSchema }
    ]),
    TradeDocumentsModule,
    TradeFinanceModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}

import { Module } from '@nestjs/common';
import { TradeFinance, TradeFinanceSchema } from '../trade-finance/schemas/trade-finance.schema';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { TradeFinanceModule } from '../trade-finance/tradeFinance.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradeDocument.name, schema: TradeDocumentSchema },
      { name: TradeFinance.name, schema: TradeFinanceSchema }
    ]),
    TradeDocumentsModule,
    TradeFinanceModule,
    JwtConfigModule,
    ApiKeyAuthModule
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}

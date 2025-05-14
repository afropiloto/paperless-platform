import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: TradeDocument.name, schema: TradeDocumentSchema }]),],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository],
})
export class AnalyticsModule {}

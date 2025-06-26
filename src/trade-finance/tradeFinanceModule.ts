import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeFinanceRepository } from './trade-finance.repository';
import { TradeFinanceService } from './trade-finance.service';
import { TradeFinanceController } from './trade-finance.controller';
import { TradeFinance, TradeFinanceSchema } from './schemas/trade-finance.schema';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{name: TradeFinance.name, schema: TradeFinanceSchema }]),
    MongooseModule.forFeature([{name: TradeDocument.name, schema: TradeDocumentSchema }])
  ],
  controllers: [TradeFinanceController],
  providers: [TradeFinanceRepository, TradeFinanceService],
  exports:[TradeFinanceService]
})
export class TradeFinanceModule {

}

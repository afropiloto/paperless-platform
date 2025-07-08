import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeFinanceRepository } from './trade-finance.repository';
import { TradeFinanceService } from './trade-finance.service';
import { TradeFinanceController } from './trade-finance.controller';
import { TradeFinance, TradeFinanceSchema } from './schemas/trade-finance.schema';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';
import { DealDeskModule } from '../deal-desk/deal-desk.module';
import { BullModule } from '@nestjs/bullmq';
import {
  DealDeskQueues,
} from '../constants/app.constants';

@Module({
  imports: [
    MongooseModule.forFeature([{name: TradeFinance.name, schema: TradeFinanceSchema }]),
    MongooseModule.forFeature([{name: TradeDocument.name, schema: TradeDocumentSchema }]),
    BullModule.registerQueue(
      { name: DealDeskQueues.CUSTOMER_FUNDING_REQUESTS },
    ),
  ],
  controllers: [TradeFinanceController],
  providers: [TradeFinanceRepository, TradeFinanceService],
  exports:[TradeFinanceService]
})
export class TradeFinanceModule {

}

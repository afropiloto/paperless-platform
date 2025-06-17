import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DueDiligenceChecklist, DueDiligenceChecklistSchema } from './schemas/due-diligence-checklist.schema';
import { DueDiligenceChecklistRepository } from './repositories/due-diligence-checklist.repository';
import { DueDiligenceChecklistService } from './services/due-diligence-checklist.service';
import { DueDiligenceChecklistController } from './controllers/due-diligence-checklist.controller';
import { DealProcessing, DealProcessingSchema } from './schemas/deal-processing.schema';
import { DealProcessingRepository } from './repositories/deal-processing.repository';
import { DealProcessingService } from './services/deal-processing.service';
import { DealProcessingController } from './controllers/deal-processing.controller';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { TradeFinance, TradeFinanceSchema } from '../trade-finance/schemas/trade-finance.schema';
import { PromissoryNotePdfService } from './services/promissory-note-pdf.service';
import { CommonModule } from '../common/common.module';
import { FileStorageModule } from '../file-storage/file-storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealProcessing.name, schema: DealProcessingSchema },
      { name: DueDiligenceChecklist.name, schema: DueDiligenceChecklistSchema },
      { name: Account.name, schema: AccountSchema },
      { name: TradeFinance.name, schema: TradeFinanceSchema },
    ]),
    CommonModule,
    FileStorageModule
  ],
  controllers: [
    DueDiligenceChecklistController,
    DealProcessingController,
  ],
  providers: [
    DueDiligenceChecklistRepository,
    DueDiligenceChecklistService,
    DealProcessingRepository,
    DealProcessingService,
    PromissoryNotePdfService
  ]
})
export class DealDeskModule {}

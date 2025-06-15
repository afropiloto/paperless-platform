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
import { ChecklistTemplateModule } from './checklist-template/checklist-template.module';
import { ChecklistTemplateController } from './checklist-template/checklist-template.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealProcessing.name, schema: DealProcessingSchema },
      { name: DueDiligenceChecklist.name, schema: DueDiligenceChecklistSchema },
      { name: Account.name, schema: AccountSchema },
      { name: TradeFinance.name, schema: TradeFinanceSchema },
    ]),
    ChecklistTemplateModule
  ],
  controllers: [
    DueDiligenceChecklistController,
    DealProcessingController,
    ChecklistTemplateController
  ],
  providers: [
    DueDiligenceChecklistRepository,
    DueDiligenceChecklistService,
    DealProcessingRepository,
    DealProcessingService
  ]
})
export class DealDeskModule {}

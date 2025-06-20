import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DealProcessing, DealProcessingSchema } from './schemas/deal-processing.schema';
import { DealProcessingRepository } from './deal-processing.repository';
import { DealProcessingService } from './deal-processing.service';
import { DealProcessingController } from './deal-processing.controller';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { TradeFinance, TradeFinanceSchema } from '../trade-finance/schemas/trade-finance.schema';
import { PromissoryNotePdfService } from './promissory-note-pdf.service';
import { CommonModule } from '../common/common.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { DueDiligenceChecklistsModule } from '../due-diligence-checklists/due-diligence-checklists.module';
import { DueDiligenceChecklistsService } from '../due-diligence-checklists/due-diligence-checklists.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DealProcessing.name, schema: DealProcessingSchema },
      { name: Account.name, schema: AccountSchema },
      { name: TradeFinance.name, schema: TradeFinanceSchema },
    ]),
    DueDiligenceChecklistsModule,
    CommonModule,
    FileStorageModule
  ],
  controllers: [
    DealProcessingController,
  ],
  providers: [
    DealProcessingRepository,
    DealProcessingService,
    PromissoryNotePdfService,
    DueDiligenceChecklistsService,
  ]
})
export class DealDeskModule {}

import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
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
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { ConfigModule } from '@nestjs/config';
import { TradeFinanceModule } from '../trade-finance/tradeFinance.module';
import { AccountsModule } from '../accounts/accounts.module';
import { IssueTradeDocumentModule } from '../issue-trade-document/issue-trade-document.module';
import { DocumentSigningModule } from '../document-signing/document-signing.module';
import { DocumentSigningBatchCheckService } from './document-signing-batch-check.service';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: DealProcessing.name, schema: DealProcessingSchema },
      { name: Account.name, schema: AccountSchema },
      { name: TradeFinance.name, schema: TradeFinanceSchema },
    ]),
    DueDiligenceChecklistsModule,
    CommonModule,
    TradeDocumentsModule,
    forwardRef(() => TradeFinanceModule),
    FileStorageModule,
    ConfigModule,
    AccountsModule,
    IssueTradeDocumentModule,
    DocumentSigningModule,
    FileStorageModule,
    AuditModule,
    JwtConfigModule,
    ApiKeyAuthModule
  ],
  controllers: [
    DealProcessingController,
  ],
  providers: [
    DealProcessingRepository,
    DealProcessingService,
    PromissoryNotePdfService,
    DueDiligenceChecklistsService,
    DocumentSigningBatchCheckService,
  ],
  exports: [DealProcessingService]

})
export class DealDeskModule {}

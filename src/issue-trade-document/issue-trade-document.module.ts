import { Module } from '@nestjs/common';
import { IssueTradeDocumentController } from './issue-trade-document.controller';
import { IssueTradeDocumentService } from './issue-trade-document.service';
import { BullModule } from '@nestjs/bullmq';
import {
  FINALISE_ISSUE_QUEUE,
  ISSUED_FILE_QUEUE,
  MINT_DOCUMENT_QUEUE,
  TRADE_DOCUMENT_QUEUE,
  TT_FILE_QUEUE,
} from '../constants/app.constants';
import { AuditModule } from '../audit/audit.module';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { TtFileProcessor } from './processors/tt-file.processor';
import { IssuedFileProcessor } from './processors/issued-file.processor';
import { MintDocumentProcessor } from './processors/mint-document.processor';
import { FinaliseIssueProcessor } from './processors/finalise-issue.processor';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { TradeTrustModule } from '../trade-trust/trade-trust.module';
import { AccountsModule } from '../accounts/accounts.module';


@Module({
  imports: [
    BullModule.registerQueue(
      { name: TRADE_DOCUMENT_QUEUE },
      { name: TT_FILE_QUEUE },
      { name: ISSUED_FILE_QUEUE },
      { name: MINT_DOCUMENT_QUEUE },
      { name: FINALISE_ISSUE_QUEUE }
    ),
    BullModule.registerFlowProducer({
      name: 'issue-trade-document'
    }),
    BullModule.registerFlowProducer({
      name: 'issue-multi-sign-trade-document'
    }),
    AuditModule,
    FileStorageModule,
    TradeDocumentsModule,
    TradeTrustModule,
    AccountsModule
  ],
  controllers: [IssueTradeDocumentController],
  providers: [
    IssueTradeDocumentService,
    TtFileProcessor,
    IssuedFileProcessor,
    MintDocumentProcessor,
    FinaliseIssueProcessor
  ],
  exports: [IssueTradeDocumentService]
})
export class IssueTradeDocumentModule {}

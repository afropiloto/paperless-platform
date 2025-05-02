import { Module } from '@nestjs/common';
import { IssueTradeDocumentController } from './issue-trade-document.controller';
import { IssueTradeDocumentService } from './issue-trade-document.service';
import { BullModule } from '@nestjs/bullmq';
import { TRADE_TRUST_QUEUE_NAME } from '../constants/app.constants';
import { AuditModule } from '../audit/audit.module';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';

@Module({
  imports: [
    BullModule.registerQueue({name: TRADE_TRUST_QUEUE_NAME}),
    AuditModule,
    TradeDocumentsModule
  ],
  controllers: [IssueTradeDocumentController],
  providers: [IssueTradeDocumentService ]
})
export class IssueTradeDocumentModule {}

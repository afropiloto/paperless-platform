import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GeneralResponseDto } from '../common/common-dto';
import { InjectQueue } from '@nestjs/bullmq';
import {
  TRADE_TRUST_PREPARE_ISSUE_EVENT,
  TRADE_TRUST_QUEUE_NAME,
} from '../constants/app.constants';
import { Queue } from 'bullmq';
import {
  TradeDocumentStatus,
  TradeDocumentType,
} from '../types/trade-documents.types';
import {
  TradeTrustDocumentClass,
  TradeTrustIssueJob,
} from '../trade-trust/trade-trust.types';
import { AuditService } from '../audit/audit.service';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { AuditEventType } from '../audit/audit-event-type.enum';
import { CreateAuditEventDto } from '../audit/dtos/create-audit-event.dto';
import { TradeDocumentDto } from '../trade-documents/dtos/trade-document.dto';
import { getTradeTrustDocumentClass } from '../trade-trust/trade-trust-utils';
import { isAddress } from 'ethers-v6';

@Injectable()
export class IssueTradeDocumentService {
  private readonly logger = new Logger(IssueTradeDocumentService.name);
  constructor(
    @InjectQueue(TRADE_TRUST_QUEUE_NAME)
    private readonly tradeTrustQueue: Queue,
    private readonly auditService: AuditService,
    private readonly tradeDocumentsService: TradeDocumentsService,
  ) {}

  private isReadyToIssue(tradeDocument: TradeDocumentDto): {readyToIssue: boolean, message?: string} {
    // Document must be In Progress
    if (
      !tradeDocument.status ||
      tradeDocument.status.toLowerCase() !==
        TradeDocumentStatus.IN_PROGRESS.toLowerCase()
    ) {

      return {readyToIssue: false, message: 'Trade Document status is must be In Progress'};
    }

    // Document must have a document reference
    if (
      !tradeDocument.documentReference ||
      tradeDocument.documentReference.trim().length === 0
    ) {
      return {readyToIssue: false, message: 'Trade Document must have a documentReference set'};
    }

    // Document must have valid content for the documentType
    if (!tradeDocument.documentType) {
      return {readyToIssue: false, message: 'Trade Document must have a documentType set'};
    }
    switch (tradeDocument.documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE.toLowerCase():
        if (!tradeDocument.invoiceContent) {
          return {readyToIssue: false, message: 'Invoice Trade Documents must have valid invoiceContent'};
        }
        break;
      case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
        if (!tradeDocument.promissoryNoteContent) {
          return {readyToIssue: false, message: 'Promissory Note Trade Documents must have valid promissoryNoteContent'};
        }
        break;
      case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
        if (!tradeDocument.billOfExchangeContent) {
          return {readyToIssue: false, message: 'Invoice Trade Documents must have valid billOfExchangeContent'};
        }
        break;
      case TradeDocumentType.OTHER.toLowerCase():
        if (!tradeDocument.otherDocumentContent) {
          return {readyToIssue: false, message: 'Invoice Trade Documents must have valid otherDocumentContent'};
        }
        break;
    }

    // If the document is transferable it must have valid claimants
    if (
      getTradeTrustDocumentClass(tradeDocument.documentType) ===
      TradeTrustDocumentClass.TRANSFERABLE
    ) {
      if (!tradeDocument.claimants.beneficiary.walletAddress && isAddress(tradeDocument.claimants.beneficiary.walletAddress)) {
        return {readyToIssue: false, message: 'Transferable Trade Documents must have a valid wallet address for the beneficiary'};
      }
      if (!tradeDocument.claimants.holder.walletAddress && isAddress(tradeDocument.claimants.holder.walletAddress)) {
        return {readyToIssue: false, message: 'Transferable Trade Documents must have a valid wallet address for the holder'};
      }
    }

    return {readyToIssue: true};
  }

  async issueTradeDocument(
    accountId: string,
    documentId: string,
  ): Promise<GeneralResponseDto> {
    const tradeDocument = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
      [
        'documentReference',
        'status',
        'documentType',
        'invoiceContent',
        'billOfExchangeContent',
        'PromissoryNoteContent',
        'otherDocumentContent',
        'claimants',
      ],
      ['wrappedContent', 'tradeDocumentFile', 'merkleRoot'],
    );
    if (!tradeDocument) {
      throw new NotFoundException(`Trade document does not exist`);
    }

    const currentState = this.isReadyToIssue(tradeDocument);
    if (!currentState.readyToIssue) {
      throw new BadRequestException(`Trade Document is not ready to be issued. ${currentState.message}`);
    }

    // Document ready to be issued so add to Trade Trust Queue to begin issue process
    const jobDetails: TradeTrustIssueJob = {
      accountId: accountId,
      documentId: documentId,
      documentType: tradeDocument.documentType,
    };
    try {
      const job = await this.tradeTrustQueue.add(
        TRADE_TRUST_PREPARE_ISSUE_EVENT,
        jobDetails,
      );
      this.logger.debug({
        message: 'Trade Document scheduled for issue',
        jobId: job.id,
        accountId,
        documentId,
      });

      await this.auditService.log({
        eventType: AuditEventType.DOCUMENT_SCHEDULED_FOR_ISSUE,
        accountId,
        documentId,
      } as CreateAuditEventDto);

      return { success: true, message: 'Document scheduled to be issued' };
    } catch (error) {
      this.logger.error({
        message: 'Failed to schedule Trade Document to be issued',
        error: error.message,
        accountId,
        documentId,
      });
      return {
        success: false,
        message: 'Failed to schedule Trade Document to be issued',
      };
    }
  }
}

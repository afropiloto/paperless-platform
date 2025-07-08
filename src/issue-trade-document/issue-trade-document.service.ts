import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectFlowProducer } from '@nestjs/bullmq';
import { FlowProducer } from 'bullmq';
import {
  TradeDocumentStatus,
  TradeDocumentType,
} from '../types/trade-documents.types';
import { TradeTrustDocumentClass } from '../trade-trust/trade-trust.types';
import { AuditService } from '../audit/audit.service';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import {
  BillOfExchangeContentDto,
  InvoiceContentDto,
  OtherDocumentContentDto,
  PromissoryNoteContentDto,
  TradeDocumentDto,
} from '../trade-documents/dtos/trade-document.dto';
import { getTradeTrustDocumentClass } from '../trade-trust/trade-trust-utils';
import { isAddress } from 'ethers-v6';
import {
  BillOfExchangeContent,
  InvoiceContent,
  OtherDocumentContent,
  PromissoryNoteContent,
} from '../trade-documents/schema/document-content.schema';

import { GeneralResponseDto } from '../common/common-dto';
import { plainToInstance } from 'class-transformer';

import { generateTrackingId } from '../utils/issued-pdf/document-tracking';
import {
  getIssueMultiSignTradeDocumentEventFlow,
  getIssueTradeDocumentEventFlow,
  IssueJobData,
} from '../common/event-flows/issue-event-flow';
import { DocumentSigningCreationDetailsDto } from '../document-signing/dtos/document-signing.dto';
import {
  CreateDocumentSigningEventJobData
} from '../document-signing/types/signing-events.types';


export interface IssueTradeDocumentDetails {
  accountId: string;
  documentId: string;
}

@Injectable()
export class IssueTradeDocumentService {
  private readonly logger = new Logger(IssueTradeDocumentService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly tradeDocumentsService: TradeDocumentsService,
    @InjectFlowProducer('issue-trade-document')
    private readonly issueDocumentFlowProducer: FlowProducer,
    @InjectFlowProducer('issue-multi-sign-trade-document')
    private readonly issueMultiSignDocumentFlowProducer: FlowProducer,
  ) {}

  private isReadyToIssue(tradeDocument: TradeDocumentDto): {
    readyToIssue: boolean;
    message?: string;
  } {
    // Document must be In Progress
    if (
      !tradeDocument.status ||
      tradeDocument.status.toLowerCase() !==
        TradeDocumentStatus.IN_PROGRESS.toLowerCase()
    ) {
      return {
        readyToIssue: false,
        message: 'Trade Document status is must be In Progress',
      };
    }

    // Document must have a document reference
    if (
      !tradeDocument.documentReference ||
      tradeDocument.documentReference.trim().length === 0
    ) {
      return {
        readyToIssue: false,
        message: 'Trade Document must have a documentReference set',
      };
    }

    // Document must have valid content for the documentType
    if (!tradeDocument.documentType) {
      return {
        readyToIssue: false,
        message: 'Trade Document must have a documentType set',
      };
    }

    switch (tradeDocument.documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE.toLowerCase():
        if (
          !tradeDocument.documentContent ||
          !(tradeDocument.documentContent instanceof InvoiceContentDto)
        ) {
          return {
            readyToIssue: false,
            message: 'Invoice Trade Documents must have valid Invoice content',
          };
        }
        break;
      case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
        if (
          !tradeDocument.documentContent ||
          !(tradeDocument.documentContent instanceof PromissoryNoteContentDto)
        ) {
          return {
            readyToIssue: false,
            message:
              'Promissory Note Trade Documents must have valid Promissory Note content',
          };
        }
        break;
      case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
        if (
          !tradeDocument.documentContent ||
          !(tradeDocument.documentContent instanceof BillOfExchangeContentDto)
        ) {
          return {
            readyToIssue: false,
            message:
              'Bill of Exchange Trade Documents must have valid Bill Of Exchange content',
          };
        }
        break;
      case TradeDocumentType.OTHER.toLowerCase():
        if (
          !tradeDocument.documentContent ||
          !(tradeDocument.documentContent instanceof OtherDocumentContentDto)
        ) {
          return {
            readyToIssue: false,
            message:
              'Other Trade Documents must have valid Other Document content',
          };
        }
        break;
    }

    // If the document is transferable it must have valid claimants
    if (
      getTradeTrustDocumentClass(tradeDocument.documentType) ===
      TradeTrustDocumentClass.TRANSFERABLE
    ) {
      if (
        !tradeDocument.claimants.beneficiary.walletAddress &&
        isAddress(tradeDocument.claimants.beneficiary.walletAddress)
      ) {
        return {
          readyToIssue: false,
          message:
            'Transferable Trade Documents must have a valid wallet address for the beneficiary',
        };
      }
      if (
        !tradeDocument.claimants.owner.walletAddress &&
        isAddress(tradeDocument.claimants.owner.walletAddress)
      ) {
        return {
          readyToIssue: false,
          message:
            'Transferable Trade Documents must have a valid wallet address for the holder',
        };
      }
    }

    return { readyToIssue: true };
  }

  async issueTradeDocument(data: IssueTradeDocumentDetails) {
    const { accountId, documentId } = data;

    const document = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
    );
    if (!document) {
      throw new NotFoundException('The trade document could not be found');
    }
    const documentStatus = this.isReadyToIssue(document);
    if (!documentStatus.readyToIssue) {
      throw new BadRequestException(
        `The trade document could not be ready to issue: ${documentStatus.message}`,
      );
    }

    const isTransferrable =
      getTradeTrustDocumentClass(document.documentType) ===
      TradeTrustDocumentClass.TRANSFERABLE;

    const issueDate = new Date();
    const documentTrackingId = generateTrackingId();
    const documentReference = document.documentReference;

    // Set the document status to Processing to prevent further actions until complete
    await this.tradeDocumentsService.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.PROCESSING,
    );

    // The flow we are looking for here a strict sequence of steps where each step finishes before the next one
    //  1. produce-issued-file
    //  2. produce-tt-file
    //  3. mint-document (this only occurs if the trade document is transferrable)
    //  4. finalise-issue
    //  Because we want a strict order of steps, we express this in reverse order and make steps the child of the previous step
    const jobData: IssueJobData = { accountId, documentId, isTransferrable, issueDate, documentTrackingId, documentReference }
    await this.issueDocumentFlowProducer.add(getIssueTradeDocumentEventFlow(jobData))

    return plainToInstance(GeneralResponseDto, {
      success: true,
      message: 'Trade Document scheduled for Issuing',
    });
  }

  async issueMultiSignTradeDocument(data: IssueTradeDocumentDetails, documentSigningDetails: DocumentSigningCreationDetailsDto) {
    const { accountId, documentId } = data;

    const document = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
    );
    if (!document) {
      throw new NotFoundException('The trade document could not be found');
    }
    const documentStatus = this.isReadyToIssue(document);
    if (!documentStatus.readyToIssue) {
      throw new BadRequestException(
        `The trade document could not be ready to issue: ${documentStatus.message}`,
      );
    }

    const isTransferrable =
      getTradeTrustDocumentClass(document.documentType) ===
      TradeTrustDocumentClass.TRANSFERABLE;

    const issueDate = new Date();
    const documentTrackingId = generateTrackingId();
    const documentReference = document.documentReference;

    // Set the document status to Processing to prevent further actions until complete
    await this.tradeDocumentsService.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.PROCESSING,
    );

    // The flow we are looking for here a strict sequence of steps where each step finishes before the next one
    //  1. produce-issued-file
    //  2. produce-tt-file
    //  3. mint-document (this only occurs if the trade document is transferrable)
    //  4. finalise-issue
    //  Because we want a strict order of steps, we express this in reverse order and make steps the child of the previous step
    const issueJobData: IssueJobData = { accountId, documentId, isTransferrable, issueDate, documentTrackingId, documentReference }
    const signingJobData: CreateDocumentSigningEventJobData = {
      documentId,
      accountId,
      description: documentSigningDetails.description,
      expiryDate: documentSigningDetails.expiryDate,
      parties: documentSigningDetails.parties.map((party) => { return {walletAddress: party.walletAddress, name: party.name, role: party.role } ; }),
    }

    await this.issueMultiSignDocumentFlowProducer.add(getIssueMultiSignTradeDocumentEventFlow(issueJobData, signingJobData))

    return plainToInstance(GeneralResponseDto, {
      success: true,
      message: 'Multi-Sign Trade Document scheduled for Issuing',
    });
  }

}

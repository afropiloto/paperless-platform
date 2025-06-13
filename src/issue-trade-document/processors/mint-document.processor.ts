import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IssueJobData } from '../issue-trade-document.types';
import { Logger } from '@nestjs/common';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { TradeTrustService } from '../../trade-trust/trade-trust.service';
import { AuditService } from '../../audit/audit.service';
import { IssueDetailsDto } from '../../trade-documents/dtos/trade-document.dto';
import { AuditEventType } from '../../audit/audit-event-type.enum';
import { MINT_DOCUMENT_QUEUE } from '../../constants/app.constants';

@Processor(MINT_DOCUMENT_QUEUE)
export class MintDocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(MintDocumentProcessor.name);

  constructor(
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly tradeTrustService: TradeTrustService,
    private readonly auditService: AuditService,) {
    super();
  }

  async process(job: Job<IssueJobData>): Promise<void> {
    const { accountId, documentId, isTransferrable } = job.data;
    this.logger.debug({ accountId, documentId, isTransferrable })
    if (!isTransferrable) {
      // Only mint transferable documents
      return;
    }

    this.logger.debug({
      message: 'Minting Verifiable Document',
      accountId: job.data.accountId,
      documentId: job.data.documentId,
    });

    const documentDetails = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
      ['issueDetails', 'claimants'],
    );

    this.logger.debug({issueDetails: documentDetails.issueDetails, claimants: documentDetails.claimants})
    const { receipt, chainId, contractAddress } =
      await this.tradeTrustService.mintTransferableDocument(
        documentDetails.issueDetails.merkleRoot,
        documentDetails.claimants.beneficiary.walletAddress,
        documentDetails.claimants.owner.walletAddress,
      );
    this.logger.debug({receipt, chainId, contractAddress})
    // Update the document to be Issued
    const issueDetails: IssueDetailsDto = {
      ...documentDetails.issueDetails,
      transactionHash: receipt,
      chainId: parseInt(chainId),
      contractAddress,
    };
    await this.tradeDocumentsService.updateTradeDocumentIssueDetails(
      accountId,
      documentId,
      issueDetails,
    );

    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_ISSUED,
      accountId,
      documentId,
      details: { message: 'Transferable Document Minted', ...issueDetails },
    });
  }
} 
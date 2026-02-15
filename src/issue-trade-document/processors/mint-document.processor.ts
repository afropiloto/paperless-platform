import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { IssueJobData } from '../../common/event-flows/issue-event-flow';
import { Inject, Logger } from '@nestjs/common';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { TradeTrustService } from '../../trade-trust/trade-trust.service';
import { AuditService } from '../../audit/audit.service';
import { IssueDetailsDto } from '../../trade-documents/dtos/trade-document.dto';
import { AuditEventType, AuditSubject } from '../../audit/audit-event-type.enum';
import { MINT_DOCUMENT_QUEUE } from '../../constants/app.constants';

@Processor(MINT_DOCUMENT_QUEUE)
export class MintDocumentProcessor extends WorkerHost {
  private readonly logger = new Logger(MintDocumentProcessor.name);

  constructor(
    @Inject(TradeDocumentsService)
    private readonly tradeDocumentsService: TradeDocumentsService,
    @Inject(TradeTrustService)
    private readonly tradeTrustService: TradeTrustService,
    @Inject(AuditService)
    private readonly auditService: AuditService,) {
    super();
  }

  async process(job: Job<IssueJobData>): Promise<void> {
    const { accountId, documentId, isTransferrable } = job.data;
    if (!isTransferrable) {
      // Only mint transferable documents
      return;
    }

    this.logger.log({
      message: 'Minting Verifiable Document',
      accountId: job.data.accountId,
      documentId: job.data.documentId,
    });

    const documentDetails = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
      ['issueDetails', 'claimants'],
    );


    const { receipt, chainId, contractAddress } =
      await this.tradeTrustService.mintTransferableDocument(
        documentDetails.issueDetails.merkleRoot,
        documentDetails.claimants.beneficiary.walletAddress,
        documentDetails.claimants.owner.walletAddress,
      );

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
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.DOCUMENT_ISSUED,
      identifier: documentId,
      accountId,
      details: {message: 'Transferable Document Minted', ...issueDetails },
    });
  }
} 
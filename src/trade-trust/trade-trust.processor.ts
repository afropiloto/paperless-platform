import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import {
  TRADE_TRUST_ISSUE_EVENT,
  TRADE_TRUST_MINT_EVENT,
  TRADE_TRUST_PREPARE_ISSUE_EVENT,
  TRADE_TRUST_QUEUE_NAME,
} from '../constants/app.constants';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  TradeDocumentFileDetails,
  TradeDocumentStatus,
} from '../types/trade-documents.types';
import {
  TradeTrustDocumentClass,
  TradeTrustIssueJob,
  WrappedDocumentDetails,
} from './trade-trust.types';

import { TradeTrustService } from './trade-trust.service';
import { TradeDocumentsRepository } from '../trade-documents/trade-documents.repository';
import { IssueDetailsDto } from '../trade-documents/dtos/trade-document.dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/audit-event-type.enum';
import { getTradeTrustDocumentClass } from './trade-trust-utils';

@Processor(TRADE_TRUST_QUEUE_NAME)
export class TradeTrustProcessor extends WorkerHost {
  private readonly logger = new Logger(TradeTrustProcessor.name);

  constructor(
    @InjectQueue(TRADE_TRUST_QUEUE_NAME)
    private readonly tradeTrustQueue: Queue,
    private readonly tradeDocumentsRepository: TradeDocumentsRepository,
    private readonly tradeTrustService: TradeTrustService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(job: Job<TradeTrustIssueJob>) {
    switch (job.name) {
      case TRADE_TRUST_PREPARE_ISSUE_EVENT:
        return await this.processPrepareForIssueEvent(job);
      case TRADE_TRUST_ISSUE_EVENT:
        return await this.processIssueVerifiableDocumentEvent(job);
      case TRADE_TRUST_MINT_EVENT:
        return await this.processMintTransferableDocumentEvent(job);
      default:
        this.logger.error({
          message: 'Unknown Trade Trust event',
          jobId: job.id,
          event: job.name,
        });
        return;
    }
  }

  @OnWorkerEvent('failed')
  async onJobFailed(job: Job, error: Error): Promise<void> {
    this.logger.error({
      message: `Permanent Fail: Job failed to complete after ${job.attemptsMade} attempts`,
      error: error.message,
      jobId: job.id,
      event: job.name,
      jobData: job.data,
    });

    // Extract account id and document id from job data and update document to in progress
    const { accountId, documentId } = job.data;
    await this.tradeDocumentsRepository.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.IN_PROGRESS,
    );
    await this.auditService.log({
      eventType: AuditEventType.PROCESSING_ERROR,
      documentId,
      accountId,
      details: {
        message: 'Failed to Issue Trade Document',
        error: error.message,
      },
    });
    // ToDo: Need to decide what to do if the wrap/issue/mint fails
    //  Perhaps we need a notifications feature that can alert users to issues?
  }

  private async processPrepareForIssueEvent(job: Job<TradeTrustIssueJob>) {
    this.logger.debug({
      message: 'Preparing for Issue',
      accountId: job.data.accountId,
      documentId: job.data.documentId,
      documentType: job.data.documentType,
    });

    // Retrieve the Trade Document Details
    const { accountId, documentId, documentType } = job.data;
    const contentField =
      this.tradeTrustService.getDocumentContentField(documentType);

    const tradeDocumentContent =
      await this.tradeDocumentsRepository.getDocumentById(
        accountId,
        documentId,
        [contentField],
      );
    const tradeDocumentFile =
      await this.tradeDocumentsRepository.getDocumentFileById(
        accountId,
        documentId,
      );

    if (!tradeDocumentContent[contentField]) {
      this.logger.error({
        message:
          'Unable to prepare document for issue. Document has no content',
        accountId,
        documentId,
        contentField,
      });
      throw new Error('Trade Document does not have any content');
    }

    // ToDO: Need to create verifiable document and store this before wrapping


    // Wrap document and store wrapped content and merkle root
    const tradeTrustDocumentType =
      getTradeTrustDocumentClass(job.data.documentType);
    const attachments = [
      {
        fileName: tradeDocumentFile.fileName,
        mimeType: tradeDocumentFile.mimeType,
        dataUrl: tradeDocumentFile.dataUrl,
      } as TradeDocumentFileDetails,
    ];

    const documentContent = { ...tradeDocumentContent[contentField]._doc };
    const { merkleRoot, wrappedContent } =
      await this.tradeTrustService.wrapDocument(
        tradeTrustDocumentType,
        attachments,
        documentContent,
      );
    // Save the merkleRoot and wrappedContent to the database
    const documentClass =
      getTradeTrustDocumentClass(documentType);
    const issueDetails: IssueDetailsDto = {
      documentClass,
      wrappedContent,
      merkleRoot,
    };

    await this.tradeDocumentsRepository.updateTradeDocumentIssueDetailsById(
      accountId,
      documentId,
      issueDetails,
    );
    await this.auditService.log({ eventType: AuditEventType.DOCUMENT_WRAPPED, accountId, documentId, details: {message: "Document signed and wrapped ready for issue"} });

    // Add event to Mint or issue the trade document
    const issueJobDetails = { accountId, documentId, documentType };
    if (documentClass === TradeTrustDocumentClass.TRANSFERABLE) {
      // Add to the Mint Queue
      const jobDetails = await this.tradeTrustQueue.add(
        TRADE_TRUST_MINT_EVENT,
        issueJobDetails,
      );
      this.logger.debug({
        message: 'Added to Mint Transferable Document Queue',
        jobId: jobDetails.id,
        accountId,
        documentId,
      });
    } else {
      // Add to the Issue Queue
      const jobDetails = await this.tradeTrustQueue.add(
        TRADE_TRUST_ISSUE_EVENT,
        issueJobDetails,
      );
      this.logger.debug({
        message: 'Added to Issue Verifiable Document Queue',
        jobId: jobDetails.id,
        accountId,
        documentId,
      });
    }
    return Promise.resolve({
      merkleRoot,
      wrappedContent,
    } as WrappedDocumentDetails);
  }

  private async processIssueVerifiableDocumentEvent(
    job: Job<TradeTrustIssueJob>,
  ) {
    this.logger.debug({
      message: 'Issuing Verifiable Document',
      accountId: job.data.accountId,
      documentId: job.data.documentId,
      documentType: job.data.documentType,
    });
    // Obtain the details needed to issue the document
    const { accountId, documentId } = job.data;
    const documentDetails = await this.tradeDocumentsRepository.getDocumentById(
      accountId,
      documentId,
      ['issueDetails'],
    );

    // Mint the document on the chosen chain
    const { receipt, chainId, contractAddress } =
      await this.tradeTrustService.issueVerifiableDocument(
        documentDetails.issueDetails.merkleRoot,
      );
    // Update the document to be Issued
    const issueDetails: IssueDetailsDto = {
      ...documentDetails.issueDetails,
      transactionHash: receipt,
      chainId,
      contractAddress,
    };
    await this.tradeDocumentsRepository.updateTradeDocumentIssueDetailsById(
      accountId,
      documentId,
      issueDetails,
    );
    await this.tradeDocumentsRepository.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.ISSUED,
    );

    await this.auditService.log({ eventType: AuditEventType.DOCUMENT_ISSUED, accountId, documentId, details: {message: "Verifiable Document Issued", ...issueDetails} });
  }

  private async processMintTransferableDocumentEvent(
    job: Job<TradeTrustIssueJob>,
  ) {
    this.logger.debug({
      message: 'Minting Verifiable Document',
      accountId: job.data.accountId,
      documentId: job.data.documentId,
      documentType: job.data.documentType,
    });

    const { accountId, documentId } = job.data;
    // Obtain the details needed to mint the document
    const documentDetails = await this.tradeDocumentsRepository.getDocumentById(
      accountId,
      documentId,
      ['issueDetails', 'claimants'],
    );

    // Mint the document on the chosen chain
    const { receipt, chainId, contractAddress } =
      await this.tradeTrustService.mintTransferableDocument(
        documentDetails.issueDetails.merkleRoot,
        documentDetails.claimants.beneficiary.walletAddress,
        documentDetails.claimants.holder.walletAddress,
      );
    // Update the document to be Issued
    const issueDetails: IssueDetailsDto = {
      ...documentDetails.issueDetails,
      transactionHash: receipt,
      chainId,
      contractAddress,
    };
    await this.tradeDocumentsRepository.updateTradeDocumentIssueDetailsById(
      accountId,
      documentId,
      issueDetails,
    );
    await this.tradeDocumentsRepository.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.ISSUED,
    );

    await this.auditService.log({ eventType: AuditEventType.DOCUMENT_ISSUED, accountId, documentId, details: {message: "Transferable Document Issued", ...issueDetails} });
  }
}

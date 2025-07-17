import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DealProcessingService } from './deal-processing.service';
import { DocumentSigningService } from '../document-signing/document-signing.service';
import { DocumentSigningContractService } from '../document-signing/document-signing-contract.service';
import { DealProcessingStatus } from './types/deal-desk.types';
import { DocumentSigningStatus } from '../document-signing/types/document-signing.types';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';

@Injectable()
export class DocumentSigningBatchCheckService {
  private readonly logger = new Logger(DocumentSigningBatchCheckService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dealProcessingService: DealProcessingService,
    private readonly documentSigningService: DocumentSigningService,
    private readonly documentSigningContractService: DocumentSigningContractService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(process.env.DOCUMENT_SIGNING_BATCH_CHECK_CRON || CronExpression.EVERY_HOUR)
  async checkDocumentSigningStatus() {
    this.logger.log('Starting document signing batch check job');
    
    try {
      // Get all deal processing records with AWAITING_AGREEMENT status
      const dealProcessingRecords = await this.dealProcessingService.findByStatus(
        DealProcessingStatus.AWAITING_AGREEMENT
      );

      this.logger.log(`Found ${dealProcessingRecords.length} deal processing records to check`);

      for (const dealProcessing of dealProcessingRecords) {
        try {
          await this.processDealProcessingRecord(dealProcessing);
        } catch (error) {
          this.logger.error(
            `Failed to process deal processing record ${dealProcessing._id}: ${error.message}`,
            error.stack
          );
          // Continue with other records even if one fails
        }
      }

      this.logger.log('Document signing batch check job completed');
    } catch (error) {
      this.logger.error(
        `Document signing batch check job failed: ${error.message}`,
        error.stack
      );
    }
  }

  private async processDealProcessingRecord(dealProcessing: any) {
    if (!dealProcessing.signingEventId) {
      this.logger.warn(
        `Deal processing ${dealProcessing._id} has no signing event ID`
      );
      return;
    }

    // Get the document signing record
    const documentSigning = await this.documentSigningService.findById(
      dealProcessing.signingEventId
    );

    if (!documentSigning) {
      this.logger.warn(
        `Document signing record ${dealProcessing.signingEventId} not found`
      );
      return;
    }

    if (!documentSigning.contractDetails?.documentId) {
      this.logger.warn(
        `Document signing ${dealProcessing.signingEventId} has no contract document ID`
      );
      return;
    }

    // Get the document status from the smart contract
    const contractStatus = await this.documentSigningContractService.getDocumentStatus(
      documentSigning.contractDetails.documentId
    );

    this.logger.log(
      `Deal processing ${dealProcessing._id} has contract status: ${contractStatus}`
    );

    // Process the status based on the contract response
    switch (contractStatus) {
      case DocumentSigningStatus.PENDING:
        // Do nothing for pending status
        this.logger.debug(
          `Deal processing ${dealProcessing._id} is still pending`
        );
        break;

      case DocumentSigningStatus.EXPIRED:
        await this.handleExpiredStatus(dealProcessing, documentSigning);
        break;

      case DocumentSigningStatus.REVOKED:
        await this.handleRevokedStatus(dealProcessing, documentSigning);
        break;

      case DocumentSigningStatus.SIGNED:
        await this.handleCompletedStatus(dealProcessing, documentSigning);
        break;

      default:
        this.logger.warn(
          `Unknown contract status ${contractStatus} for deal processing ${dealProcessing._id}`
        );
    }
  }

  private async handleExpiredStatus(dealProcessing: any, documentSigning: any) {
    this.logger.log(
      `Handling expired status for deal processing ${dealProcessing._id}`
    );

    // Update document signing status
    await this.documentSigningService.updateLastKnownStatus(
      documentSigning.id,
      DocumentSigningStatus.EXPIRED
    );

    // Update deal processing status
    await this.dealProcessingService.updateStatus(
      dealProcessing._id,
      DealProcessingStatus.EXPIRED
    );

    // Log audit event
    await this.auditService.log({
      subject: AuditSubject.TRADE_FINANCE_DEAL,
      eventType: AuditEventType.DOCUMENT_SIGNING_EXPIRED,
      identifier: dealProcessing.dealId,
      details: {
        dealProcessingId: dealProcessing._id,
        documentSigningId: documentSigning.id,
        contractDocumentId: documentSigning.contractDetails.documentId,
      },
    });
  }

  private async handleRevokedStatus(dealProcessing: any, documentSigning: any) {
    this.logger.log(
      `Handling revoked status for deal processing ${dealProcessing._id}`
    );

    // Update document signing status
    await this.documentSigningService.updateLastKnownStatus(
      documentSigning.id,
      DocumentSigningStatus.REVOKED
    );

    // Update deal processing status to EXPIRED (as per requirements)
    await this.dealProcessingService.updateStatus(
      dealProcessing._id,
      DealProcessingStatus.EXPIRED
    );

    // Log audit event
    await this.auditService.log({
      subject: AuditSubject.TRADE_FINANCE_DEAL,
      eventType: AuditEventType.DOCUMENT_SIGNING_REVOKED,
      identifier: dealProcessing.dealId,
      details: {
        dealProcessingId: dealProcessing._id,
        documentSigningId: documentSigning.id,
        contractDocumentId: documentSigning.contractDetails.documentId,
      },
    });
  }

  private async handleCompletedStatus(dealProcessing: any, documentSigning: any) {
    this.logger.log(
      `Handling completed status for deal processing ${dealProcessing._id}`
    );

    // Update document signing status
    await this.documentSigningService.updateLastKnownStatus(
      documentSigning.id,
      DocumentSigningStatus.SIGNED
    );

    // Update deal processing status to FUNDING_REQUESTED
    await this.dealProcessingService.updateStatus(
      dealProcessing._id,
      DealProcessingStatus.FUNDING_REQUESTED
    );

    // Log audit event
    await this.auditService.log({
      subject: AuditSubject.TRADE_FINANCE_DEAL,
      eventType: AuditEventType.DOCUMENT_SIGNING_COMPLETED,
      identifier: dealProcessing.dealId,
      details: {
        dealProcessingId: dealProcessing._id,
        documentSigningId: documentSigning.id,
        contractDocumentId: documentSigning.contractDetails.documentId,
      },
    });
  }
} 
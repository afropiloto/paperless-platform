import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { AuditService } from '../../audit/audit.service';
import { IssueDetailsDto } from '../../trade-documents/dtos/trade-document.dto';
import { TradeDocumentStatus } from '../../types/trade-documents.types';
import { AuditEventType } from '../../audit/audit-event-type.enum';
import { FINALISE_ISSUE_QUEUE } from '../../constants/app.constants';
import { IssueJobData } from '../../common/event-flows/issue-event-flow';

@Processor(FINALISE_ISSUE_QUEUE)
export class FinaliseIssueProcessor extends WorkerHost {
  private readonly logger = new Logger(FinaliseIssueProcessor.name);

  constructor(
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly auditService: AuditService,) {
    super();
  }

  async process(job: Job<IssueJobData>): Promise<void> {
    const { accountId, documentId } = job.data;

    this.logger.debug({
      message: 'Finalising Trade Document Issue',
      accountId: accountId,
      documentId: documentId
    });

    // Obtain the details needed to mint the document
    const documentDetails = await this.tradeDocumentsService.getDocumentById(
      accountId,
      documentId,
      ['issueDetails'],
    );
    // Update the document to be Issued
    const issueDetails: IssueDetailsDto = {
      ...documentDetails.issueDetails,
      dateIssued: new Date()
    };
    await this.tradeDocumentsService.updateTradeDocumentIssueDetails(
      accountId,
      documentId,
      issueDetails,
    );
    await this.tradeDocumentsService.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.ISSUED,
    );

    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_ISSUED,
      accountId,
      documentId,
      details: { message: 'Trade Document Issued', ...issueDetails },
    });

  }
} 
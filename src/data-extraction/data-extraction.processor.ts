import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  DATA_EXTRACTION_EVENT,
  DATA_EXTRACTION_GRAIP_CALLBACK_EVENT,
  DATA_EXTRACTION_QUEUE_NAME,
} from '../constants/app.constants';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataExtractionJob, GraipDataExtractionCallBackJob } from './data-extraction.types';
import { ConfigService } from '@nestjs/config';
import { DataExtractionService } from './data-extraction.service';
import { TradeDocumentStatus } from '../types/trade-documents.types';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { TradeDocumentFileVariant } from '../trade-documents/trade-document-file.types';

@Processor(DATA_EXTRACTION_QUEUE_NAME)
export class DataExtractionProcessor extends WorkerHost {
  private readonly logger = new Logger(DataExtractionProcessor.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly dataExtractionService: DataExtractionService,
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case DATA_EXTRACTION_EVENT:
        return await this.processNewDataExtractionEvent(job);
      case DATA_EXTRACTION_GRAIP_CALLBACK_EVENT:
        return await this.processDataExtractionCallbackCheck(job);
      default:
        this.logger.error({
          message: 'Unknown data extraction event',
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
    await this.tradeDocumentsService.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.IN_PROGRESS,
    );
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.PROCESSING_ERROR,
      identifier: documentId,
      accountId,
      details: {
        message: 'Failed to extract data from trade document',
        error: error.message,
      },
    });
  }

  private async processNewDataExtractionEvent(job: Job<DataExtractionJob>) {
    const { accountId, documentId } = job.data;

    // Check if Data Extraction is enabled
    if (!this.configService.get<boolean>('GRAIP_ENABLED')) {
      this.logger.log({
        message:
          'Data Extraction via GRAIP is not enabled. Skipping data extraction.',
        accountId,
        documentId,
        jobId: job.id,
      });
      // ToDo: We need to update the trade document to In Progress
      return;
    }

    // Get the dataUrl for the document
    const { documentType, documentReference } =
      await this.tradeDocumentsService.getDocumentById(accountId, documentId, [
        'documentType',
        'documentReference',
      ]);
    const tradeDocumentFile =
      await this.tradeDocumentsService.getDocumentFileDetailsById(
        accountId,
        documentId,
        TradeDocumentFileVariant.ORIGINAL,
      );

    this.logger.log({
      message: `Processing Data Extraction Job ${job.id}`,
      accountId,
      documentId,
    });
    // Send request to GRAIP for processing
    const response = await this.dataExtractionService.sendForDataExtraction(
      documentType,
      documentReference,
      accountId,
      documentId,
      tradeDocumentFile,
    );
    if (!response.success) {
      this.logger.error({
        message: `Failed to send document for data extraction. Error: ${response.message}`,
        documentType,
        documentReference,
        accountId,
      });
      throw new Error('Failed to send document for data extraction.');
    }
    this.logger.log({
      message: 'Sent document for data extraction',
      accountId,
      documentId,
    });
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.DOCUMENT_DATA_EXTRACTION,
      identifier: documentId,
      accountId,
      details: { message: 'Document Data Extraction Initiated'},
    });
  }

  private async processDataExtractionCallbackCheck(
    job: Job<GraipDataExtractionCallBackJob>,
  ) {
    const { accountId, documentId, flowId, requestId } = job.data;
    this.logger.log({
      message: 'Processing callback',
      accountId,
      documentId,
      flowId,
      requestId,
    });

    const extractionResponse =
      await this.dataExtractionService.checkExtractionCallback({
        flowId,
        requestId,
      } as GraipDataExtractionCallBackJob);
    if (extractionResponse.success) {
      this.logger.log({
        message: 'Data Extraction Complete',
        accountId,
        documentId,
        flowId,
        requestId,
      });
      // Handle update to document
      await this.tradeDocumentsService.updateTradeDocumentById(
        accountId,
        documentId,
        {documentContent: extractionResponse.documentContent},
      );
      await this.tradeDocumentsService.updateTradeDocumentStatus(
        accountId,
        documentId,
        TradeDocumentStatus.IN_PROGRESS,
      );
      await this.auditService.log({
        subject: AuditSubject.TRADE_DOCUMENT,
        eventType: AuditEventType.DOCUMENT_DATA_EXTRACTION,
        identifier: documentId,
        accountId,
        details: {
          message: 'Document Data Extraction Completed. Trade Document Updated',
        },
      });

      return;
    } else {
      this.logger.log({
        message: 'Data Extraction not yet complete',
        accountId,
        documentId,
        flowId,
        requestId,
      });
      throw new Error('Data Extraction not yet complete');
    }
  }
}
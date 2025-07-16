import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  DATA_EXTRACTION_EVENT,
  DATA_EXTRACTION_GRAIP_CALLBACK_EVENT,
  DATA_EXTRACTION_QUEUE_NAME,
} from '../constants/app.constants';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { DataExtractionJob, ExtendAIDataExtractionCallBackJob } from './data-extraction.types';
import { ConfigService } from '@nestjs/config';
import { TradeDocumentStatus, TradeDocumentType } from '../types/trade-documents.types';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { ExtendClient } from 'extend-ai';
import { ShareLinksService } from '../share-links/share-links.service';
import {addMinutes } from '../utils/date-utils';
import { mapToDocumentContent } from './data-extraction-mapper';

@Processor(DATA_EXTRACTION_QUEUE_NAME)
export class DataExtractionExtendAiProcessor extends WorkerHost {
  private readonly logger = new Logger(DataExtractionExtendAiProcessor.name);
  private readonly extendAIClient: ExtendClient;
  constructor(
    @InjectQueue(DATA_EXTRACTION_QUEUE_NAME)
    private readonly dataExtractionQueue: Queue,
    private readonly shareLinkService: ShareLinksService,
    private readonly configService: ConfigService,
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly auditService: AuditService,
  ) {
    super();
    this.extendAIClient = new ExtendClient({token: this.configService.get<string>('EXTENDAI_API_KEY')});
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



  private async handleExtendAINotEnabled(job: Job<DataExtractionJob>): Promise<void> {
    const { accountId, documentId } = job.data;
    this.logger.log({
      message:
        'Data Extraction via GRAIP is not enabled. Skipping data extraction.',
      accountId,
      documentId,
      jobId: job.id,
    });
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
  }

  private getExtendProcessorId(documentType: TradeDocumentType) {
    switch (documentType){
      case TradeDocumentType.INVOICE:
        return this.configService.get<string>('EXTENDAI_INVOICE_PROCESSOR_ID');
      case TradeDocumentType.PROMISSORY_NOTE:
        return this.configService.get<string>('EXTENDAI_PROMISSORY_NOTE_PROCESSOR_ID')
      case TradeDocumentType.BILL_OF_EXCHANGE:
        return this.configService.get<string>('EXTENDAI_BILL_OF_EXCHANGE_PROCESSOR_ID')
      case TradeDocumentType.BILL_OF_LADING:
        return this.configService.get<string>('EXTENDAI_BILL_OF_LADING_PROCESSOR_ID')
      case TradeDocumentType.WAREHOUSE_RECEIPT:
        return this.configService.get<string>('EXTENDAI_WAREHOUSE_RECEIPT_PROCESSOR_ID');
      default:
        this.logger.error({message: "No Extend.AI Processor for this document type", documentType});
        throw new Error(`No extend.ai processor for document type: ${documentType}`);
    }

  }

  private async addToCallbackQueue(jobDetails: ExtendAIDataExtractionCallBackJob){
    try {
      await this.dataExtractionQueue.add(
        DATA_EXTRACTION_GRAIP_CALLBACK_EVENT,
        jobDetails,
      );
      this.logger.log({
        message: 'Added to extend.ai Data Extraction Callback Queue',
        jobDetails,
      });
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to submit data extraction callback job',
        error: error.message,
      });
      return {
        success: false,
        message: `Failed to add Callback to Callback queue. Error: ${error.message}}`,
      };
    }
  }

  private async processNewDataExtractionEvent(job: Job<DataExtractionJob>) {
    const { accountId, documentId, documentType } = job.data;

    // Check if Data Extraction is enabled
    if (!this.configService.get<boolean>('EXTENDAI_ENABLED')) {
      await this.handleExtendAINotEnabled(job);
      return;
    }

    // Create Shareable Link for original document
    const linkExpires = addMinutes(new Date(), 20)
    const shareableLink = await this.shareLinkService.createShareLink(accountId, documentId, {expiresAt: linkExpires}, "dataExtraction")
    // ToDO: The Paiperless App needs to provide this endpoint
    const documentLink = `${this.configService.get<string>('EXTENDAI_FILE_DOWNLOAD_URL')}files/ORIGINAL?linkId=${shareableLink.linkId}`;

    // Submit for processing
    const processorId = this.getExtendProcessorId(documentType.toLowerCase() as TradeDocumentType);
    const processorRun = await this.extendAIClient.processorRun.create({
      processorId: processorId,
      file: {
        fileUrl: documentLink
      }
    })
    if (!processorRun.success) {
      this.logger.error({message: "Failed to initiate data extraction", job, error: processorRun.processorRun.failureReason})
      throw new Error(`Failed to initiate. ${processorRun.processorRun.failureReason}`)
    }

    // Create Callback processing job
    const callbackJob: ExtendAIDataExtractionCallBackJob = {
      accountId, documentId, documentType, runId: processorRun.processorRun.id,
    }
    await this.addToCallbackQueue(callbackJob);

    // Set Trade Document to have status of Processing
    await this.tradeDocumentsService.updateTradeDocumentStatus(
      accountId,
      documentId,
      TradeDocumentStatus.PROCESSING,
    );
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.DOCUMENT_DATA_EXTRACTION,
      identifier: documentId,
      details: { message: 'Document Data Extraction Initiated'},
    });


  }

  private async processDataExtractionCallbackCheck(
    job: Job<ExtendAIDataExtractionCallBackJob>,
  ) {
    const { accountId, documentId, documentType, runId } = job.data;
    this.logger.log({
      message: 'Processing extend.ai callback',
      accountId,
      documentId,
      runId,
    });

    // Make call to get run status
    const response = await this.extendAIClient.processorRun.get(runId);
    if (!response.success) {
      this.logger.error({message: "Failed to retrieve run status from extend.ai", job, error: response.processorRun.failureReason})
      throw new Error(`Failed to process data extraction callback job ${job.id}`);
    }
    if (response.processorRun.status === "CANCELLED" || response.processorRun.status === "FAILED" ) {
      this.logger.error({message: "Failed to retrieve run status from extend.ai", job, runStatus: response.processorRun.status, error: response.processorRun.failureReason})
      throw new Error(`Failed to process data extraction callback job ${job.id}`);
    }

    if (response.processorRun.status === "PROCESSING") {
      this.logger.log({message: "Data Extraction Processing not yet complete", job})
      throw new Error(`Data Extraction still in progress`);
    }

    // Processing complete so
    this.logger.log({
      message: 'Data Extraction Complete',
      accountId,
      documentId,
      runId
    });

    const mappedData = mapToDocumentContent(response.processorRun.output, documentType.toLowerCase() as TradeDocumentType);
    await this.tradeDocumentsService.updateTradeDocumentById(
        accountId,
        documentId,
        {documentContent: mappedData},
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
    }
}
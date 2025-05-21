import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpsertTradeDocumentDto } from './dtos/trade-document.dto';
import {
  TradeDocumentFileDetails,
  TradeDocumentStatus,
  TradeDocumentType,
} from '../types/trade-documents.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  DATA_EXTRACTION_EVENT,
  DATA_EXTRACTION_QUEUE_NAME,
} from '../constants/app.constants';
import { DataExtractionJob } from '../data-extraction/data-extraction.types';
import { TradeDocumentsRepository } from './trade-documents.repository';
import { GeneralResponseDto } from '../common/common-dto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType } from '../audit/audit-event-type.enum';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto, TradeDocumentsSearchResultsDto } from './dtos/search-trade-documents.dto';

@Injectable()
export class TradeDocumentsService {
  private readonly logger = new Logger(TradeDocumentsService.name);

  constructor(
    private readonly tradeDocumentsRepo: TradeDocumentsRepository,
    private readonly auditService: AuditService,
    @InjectQueue(DATA_EXTRACTION_QUEUE_NAME)
    private readonly dataExtractionQueue: Queue,
  ) {}

  private canPerformDataExtraction(documentType: string): boolean {
    switch (documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE:
        return true;
      case TradeDocumentType.BILL_OF_EXCHANGE:
      case TradeDocumentType.PROMISSORY_NOTE:
      case TradeDocumentType.OTHER:
        return false;
      default:
        return false;
    }
  }

  private extractFileDetails(
    file: Express.Multer.File,
  ): TradeDocumentFileDetails {
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;

    return {
      fileName: file.originalname,
      fileSize: file.size,
      dataUrl,
      mimeType: file.mimetype,
    };
  }

  async createTradeDocument(
    accountId: string,
    tradeDocument: UpsertTradeDocumentDto,
  ) {
    const newDocument = await this.tradeDocumentsRepo.createTradeDocument(
      accountId,
      tradeDocument,
      TradeDocumentStatus.IN_PROGRESS,
    );
    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_CREATED,
      accountId,
      documentId: newDocument.id,
    });
    return newDocument;
  }

  async getDocumentById(
    accountId: string,
    documentId: string,
    includes: string[] = [],
    excludes: string[] = [],
  ) {
    const document = await this.tradeDocumentsRepo.getDocumentById(
      accountId,
      documentId,
      includes,
      excludes,
    );
    if (!document) {
      throw new NotFoundException('Trade Document not found for this account');
    }
    return document;
  }

  async getDocumentsByType(accountId: string, documentType: DocumentType) {
    const documents = await this.tradeDocumentsRepo.getDocumentsByType(
      accountId,
      documentType,
      [],
      ['wrappedContent', 'tradeDocumentFile', 'merkleRoot'],
    );
    if (!documents) {
      return [];
    }
    return documents;
  }

  async deleteDocumentById(accountId: string, documentId: string) {
    const success = await this.tradeDocumentsRepo.deleteDocumentById(
      accountId,
      documentId,
    );
    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_DELETED,
      accountId,
      documentId,
    });
    return { success: success } as GeneralResponseDto;
  }

  async updateTradeDocumentById(
    accountId: string,
    documentId: string,
    tradeDocument: UpsertTradeDocumentDto,
  ) {
    const updatedDocument =
      await this.tradeDocumentsRepo.updateTradeDocumentById(
        accountId,
        documentId,
        tradeDocument,
      );
    if (!updatedDocument) {
      throw new NotFoundException('Trade Document not found for this account');
    } else {
      await this.auditService.log({
        eventType: AuditEventType.DOCUMENT_UPDATED,
        accountId,
        documentId,
      });
      return updatedDocument;
    }
  }

  private async submitForDataExtraction(
    accountId: string,
    documentId: string,
    documentType: string,
  ) {
    try {
      const jobDetails: DataExtractionJob = {
        accountId,
        documentId,
        documentType,
      };
      const job = await this.dataExtractionQueue.add(
        DATA_EXTRACTION_EVENT,
        jobDetails,
      );
      return job.id.toString();
    } catch (error) {
      this.logger.error({
        message: 'Failed to submit Trade Document for data extraction',
        error: error.message,
        accountId,
        documentId,
      });
    }
  }

  async getDocumentFileById(accountId: string, documentId: string) {
    const fileDetails = await this.tradeDocumentsRepo.getDocumentFileById(
      accountId,
      documentId,
    );
    if (!fileDetails) {
      throw new NotFoundException(
        'Trade document file not found for this account',
      );
    } else {
      return fileDetails;
    }
  }

  async updateTradeDocumentFileById(
    accountId: string,
    documentId: string,
    file: Express.Multer.File,
  ) {
    const tradeDocumentFile = this.extractFileDetails(file);

    const tradeDocument =
      await this.tradeDocumentsRepo.updateTradeDocumentFileById(
        accountId,
        documentId,
        tradeDocumentFile,
      );

    if (!tradeDocument) {
      throw new NotFoundException('Trade document not found for this account');
    }

    const performDataExtraction = this.canPerformDataExtraction(
      tradeDocument.documentType,
    );
    const currentStatus = performDataExtraction
      ? TradeDocumentStatus.PROCESSING
      : (tradeDocument.status as TradeDocumentStatus);
    await this.tradeDocumentsRepo.updateTradeDocumentStatus(
      accountId,
      documentId,
      currentStatus,
    );

    if (performDataExtraction) {
      const jobId = await this.submitForDataExtraction(
        accountId,
        documentId,
        tradeDocument.documentType,
      );
      this.logger.log({
        message: 'Submitted for Document Data Extraction',
        accountId,
        documentId,
        jobId,
      });
    }
    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_FILE_UPDATED,
      accountId,
      documentId,
    });
  }

  async updateTradeDocumentStatus(
    accountId: string,
    documentId: string,
    newStatus: TradeDocumentStatus,
  ) {
    const updatedDocument =
      await this.tradeDocumentsRepo.updateTradeDocumentStatus(
        accountId,
        documentId,
        newStatus,
      );
    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_STATE_UPDATED,
      accountId,
      documentId,
      details: { newState: newStatus },
    });
    return updatedDocument;
  }

  async searchTradeDocumentsByAccountId(
    accountId: string,
    searchParams: SearchQueryDto,
    includes: string[] = [],
    excludes: string[] = [],
  ) {
    const results =
      await this.tradeDocumentsRepo.retrieveTradeDocumentsByAccountId(
        accountId,
        searchParams,
        includes,
        excludes,
      );
    this.logger.debug({results});
    return results ? plainToInstance(TradeDocumentsSearchResultsDto, results) : [];
  }
}

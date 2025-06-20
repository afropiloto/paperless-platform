import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CreateTradeDocumentFromFileDto, IssueDetailsDto,
  UpsertTradeDocumentDto,
} from './dtos/trade-document.dto';
import {
  FileData,
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
import {
  TradeDocumentsSearchResultsDto,
} from './dtos/search-trade-documents.dto';
import { AccountsService } from '../accounts/accounts.service';
import {
  TradeDocumentFileVariant,
  TradeDocumentFileStatus,
} from './trade-document-file.types';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { TradeDocumentFileDTO } from './dtos/trade-document-file.dto';
import { TradeDocumentProtectedAttributesUpdateDto } from './dtos/trade-document-protected-attributes-update.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';



@Injectable()
export class TradeDocumentsService {
  private readonly logger = new Logger(TradeDocumentsService.name);

  constructor(
    private readonly tradeDocumentsRepo: TradeDocumentsRepository,
    private readonly accountService: AccountsService,
    private readonly auditService: AuditService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
    @InjectQueue(DATA_EXTRACTION_QUEUE_NAME)
    private readonly dataExtractionQueue: Queue,
  ) {}

  private canPerformDataExtraction(documentType: string): boolean {
    switch (documentType?.toLowerCase()) {
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

  async createTradeDocument(
    accountId: string,
    tradeDocument: UpsertTradeDocumentDto,
  ) {
    if (!(await this.accountService.accountExists(accountId))) {
      throw new NotFoundException('Account not found');
    }

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

    // Transform the response back to use documentContent
    return newDocument;
  }

  async getDocumentById(
    accountId: string,
    documentId: string,
    includes: string[] = []
  ) {
    const document = await this.tradeDocumentsRepo.getDocumentById(
      accountId,
      documentId,
      includes
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
    const document = await this.getDocumentById(
      accountId,
      documentId, ['status']
    );

    if (!document) {
      throw new NotFoundException("The document could not be found.")
    }
    // Check if the document is in a deletable state
    if (!this.documentIsDeletable(document.status)) {
      this.logger.error({
        message: 'Document not deletable',
        accountId,
        documentId,
        status: document.status,
      });
      throw new BadRequestException('The document is not in a state where it can be deleted');
    }
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
    const document = await this.getDocumentById(
      accountId,
      documentId, ['status'],
    );
    if (!document) {
      throw new NotFoundException('The document not found for account');
    }
    // Check if the document is in an updatable state
    if (!this.documentIsUpdatable(document.status)) {
      throw new BadRequestException('The document could not be updated');
    }

    const updatedDocument = await this.tradeDocumentsRepo.updateTradeDocumentById(
      accountId,
      documentId,
      tradeDocument,
    );

    if (!updatedDocument) {
      throw new NotFoundException('Trade Document not found for this account');
    }

    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_UPDATED,
      accountId,
      documentId,
    });

    return updatedDocument;
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

  async getDocumentFileDetailsById(accountId: string, documentId: string, fileVariant: TradeDocumentFileVariant ) {
    const fileDetails = await this.tradeDocumentsRepo.getDocumentFileById(
      accountId,
      documentId,
      fileVariant
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
    tradeDocumentId: string,
    file: Express.Multer.File | FileData,
    fileVariant: TradeDocumentFileVariant = TradeDocumentFileVariant.ORIGINAL
  ) {
    const tradeDocumentExists =
      await this.tradeDocumentsRepo.tradeDocumentExists(
        accountId,
        tradeDocumentId,
      );
    if (!tradeDocumentExists) {
      throw new NotFoundException('Trade document does not exist');
    }

    // Handle both Multer file and FileData object
    const fileBuffer = file.buffer;
    const fileName = file.originalname;
    const mimeType = file.mimetype;
    const fileSize = file.size;
    
    const { storedFileName, storedFilePath } =
      await this.fileStorageService.uploadFile(
        fileBuffer,
        fileName,
        mimeType,
      );

    // Store File details
    const tradeDocumentFileDetails: TradeDocumentFileDTO = {
      storedFileName: storedFileName,
      storedFilePath: storedFilePath,
      mimeType: mimeType,
      originalFileName: fileName,
      size: fileSize,
      status: TradeDocumentFileStatus.AWAITING_VIRUS_SCAN,
    };

    const currentFileDetails = await this.tradeDocumentsRepo.getDocumentFileById(accountId, tradeDocumentId, fileVariant);
    if (currentFileDetails && currentFileDetails.storedFileName) {
      this.fileStorageService.deleteFile(currentFileDetails.storedFileName)
        .then(()=> {
          this.auditService.log({
            eventType: AuditEventType.DOCUMENT_FILE_REPLACED,
            accountId,
            documentId: tradeDocumentId,
            details: {originalFile: {fileName: currentFileDetails.originalFileName, fileType: currentFileDetails.mimeType, fileSize: currentFileDetails.size},
            updatedFile: {fileName: tradeDocumentFileDetails.originalFileName, fileType: tradeDocumentFileDetails.mimeType, fileSize: tradeDocumentFileDetails.size}},
          })
        })
    }

    // Store file details
    const tradeDocument = await this.tradeDocumentsRepo.updateTradeDocumentFileById(accountId, tradeDocumentId, fileVariant, tradeDocumentFileDetails)
    // Check if Data Extract is required or not
    const performDataExtraction = this.canPerformDataExtraction(
      tradeDocument.documentType,
    );
    const currentStatus = performDataExtraction
      ? TradeDocumentStatus.PROCESSING
      : (tradeDocument.status as TradeDocumentStatus);
    await this.tradeDocumentsRepo.updateTradeDocumentStatus(
      accountId,
      tradeDocumentId,
      currentStatus,
    );

    if (performDataExtraction) {
      const jobId = await this.submitForDataExtraction(
        accountId,
        tradeDocumentId,
        tradeDocument.documentType,
      );
      this.logger.log({
        message: 'Submitted for Document Data Extraction',
        accountId,
        documentId: tradeDocumentId,
        jobId,
      });
    }

    // Write Audit Log
    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_FILE_UPDATED,
      accountId,
      documentId: tradeDocumentId,
      details: {originalFileName: fileName, fileType: mimeType, fileSize: fileSize},
    });

    return tradeDocument;
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
    return results
      ? plainToInstance(TradeDocumentsSearchResultsDto, results)
      : {
          metadata: {
            totalDocuments: 0,
            page: searchParams.page,
            totalPages: 0,
            limit: searchParams.limit,
          },
          data: [],
        };
  }

  async createTradeDocumentFromFile(
    accountId: string,
    file: Express.Multer.File,
    createFromFile: CreateTradeDocumentFromFileDto,
  ) {
    const accountExists = await this.accountService.accountExists(accountId);
    if (!accountExists) {
      throw new NotFoundException('Account not found');
    }
    const tradeDocument: UpsertTradeDocumentDto = {
      documentType: createFromFile.documentType,
      documentReference: createFromFile.documentReference,
    };
    // Create the trade document
    const newDocument = await this.createTradeDocument(
      accountId,
      tradeDocument,
    );

    // Add the file to the trade document
    const updatedDocument = await this.updateTradeDocumentFileById(accountId, newDocument.id, file, TradeDocumentFileVariant.ORIGINAL);

    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_CREATED,
      accountId,
      documentId: updatedDocument.id,
    });
    return updatedDocument;
  }

  async getTradeDocumentFileStream(accountId: string, documentId: string, fileVariant: TradeDocumentFileVariant) {
    const fileDetails = await this.getDocumentFileDetailsById(accountId, documentId, fileVariant);

    if (!fileDetails || !fileDetails.storedFileName) {
      throw new NotFoundException("Trade Document File Not Found");
    }
    return {
      stream: this.fileStorageService.streamFile(fileDetails.storedFileName),
      headers: {
        'Content-Disposition': `attachment; filename="${fileDetails.originalFileName || 'download'}"`,
        'Content-Type': fileDetails.mimeType || 'application/octet-stream',
      }
    };
  }

  private documentIsDeletable(status: string) {
    switch (status.toLowerCase()) {
      case TradeDocumentStatus.IN_PROGRESS.toLowerCase():
        return true;
      case TradeDocumentStatus.ISSUED.toLowerCase():
        return false;
      default:
        return false;
    }
  }

  private documentIsUpdatable(status: string) {
    switch (status.toLowerCase()) {
      case TradeDocumentStatus.IN_PROGRESS.toLowerCase():
        return true;
      case TradeDocumentStatus.ISSUED.toLowerCase():
        return false;
      default:
        return false;
    }
  }

  async getTradeDocumentFile(accountId: string, documentId: string, variant: TradeDocumentFileVariant) {
    return this.tradeDocumentsRepo.getDocumentFileById(accountId, documentId, variant);
  }

  async updateTradeDocumentIssueDetails(accountId: string, documentId: string, issueDetails: IssueDetailsDto) {
    return this.tradeDocumentsRepo.updateTradeDocumentIssueDetailsById(accountId, documentId, issueDetails);
  }

  async updateProtectedAttributes(accountId: string, documentId: string, updates: TradeDocumentProtectedAttributesUpdateDto) {
    return this.tradeDocumentsRepo.updateProtectedTradeDocumentAttributesById(accountId, documentId, updates)

  }
}

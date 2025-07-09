import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
  CREATE_DOCUMENT_SIGNING_FINALISE_EVENT,
  CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT,
  CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT,
} from '../constants/app.constants';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentSigningService } from '../document-signing/document-signing.service';
import { AuditService } from '../audit/audit.service';
import { DocumentSigningContractService } from '../document-signing/document-signing-contract.service';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { CreateDocumentSigningEventJobData } from '../document-signing/types/signing-events.types';
import { DocumentSigningStatus } from '../document-signing/types/document-signing.types';
import {
  DocumentSigningCreationDetailsDto,
  UpdateSigningDetailsDto,
} from '../document-signing/dtos/document-signing.dto';
import { TradeDocumentStatus } from '../types/trade-documents.types';
import { FileStorageService } from '../file-storage/file-storage.interface';
import { subtractDates } from '../utils/date-utils';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';

@Processor(CREATE_DOCUMENT_SIGNING_EVENT_QUEUE)
export class CreateDocumentSigningEventProcessor extends WorkerHost {
  private readonly logger = new Logger(
    CreateDocumentSigningEventProcessor.name,
  );

  constructor(
    @Inject()
    private readonly documentSigningService: DocumentSigningService,
    @Inject()
    private readonly tradeDocumentService: TradeDocumentsService,
    @Inject()
    private readonly documentSigningContractService: DocumentSigningContractService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
    @Inject()
    private readonly auditService: AuditService,
  ) {
    super();
  }

  /**
   * Creates a Document Signing Event for the documentId specified
   * @param job
   */
  async process(job: Job<CreateDocumentSigningEventJobData>): Promise<void> {
    const { name, data } = job;
    switch (name) {
      case CREATE_DOCUMENT_SIGNING_FINALISE_EVENT:
        return await this.processDocumentSigningFinaliseEvent(
          data as CreateDocumentSigningEventJobData,
        );
      case CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT:
        return await this.processDocumentSigningOnChainEvent(
          data as CreateDocumentSigningEventJobData,
        );
      case CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT:
        return await this.processDocumentSigningOffChainEvent(
          data as CreateDocumentSigningEventJobData,
        );
      default:
        this.logger.warn({
          message: `Unknown Event '${name}' on ${CREATE_DOCUMENT_SIGNING_EVENT_QUEUE} queue.`,
        });
        throw new Error(
          `Unknown Event '${name}' on ${CREATE_DOCUMENT_SIGNING_EVENT_QUEUE} queue.`,
        );
    }
  }

  /**
   * Updates the document signing record to indicate it is ready for use
   * @param data The Job Data for the Create Document Signing Event
   * @private
   */
  private async processDocumentSigningFinaliseEvent(
    data: CreateDocumentSigningEventJobData,
  ) {
    this.logger.log({message:'Processing Document Signing Finalise Event', data })
    const document = await this.tradeDocumentService.getDocumentById(
      data.accountId,
      data.documentId,
    );
    if (!document) {
      throw new Error(
        `Trade Document with id '${data.documentId}' for account id '${data.accountId}' was not found`,
      );
    }
    if (!document.documentSigningId) {
      throw new Error(
        `Trade Document with id '${data.documentId}' for account id '${data.accountId}' does not have a Document Signing Event ID`,
      );
    }
    await this.documentSigningService.updateLastKnownStatus(
      document.documentSigningId,
      DocumentSigningStatus.IN_PROGRESS,
    );

    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.ON_CHAIN_SIGNING_EVENT_OPENED,
      identifier: data.documentId,
      details: {
        documentId: data.documentId,
        accountId: data.accountId,
        signingEventId: document.documentSigningId
      }
    });
  }

  /**
   * Creates a Document Signing Event on chain
   * @param data The Job Data for the Create Document Signing Event
   * @private
   */
  private async processDocumentSigningOnChainEvent(
    data: CreateDocumentSigningEventJobData,
  ) {
    this.logger.log({message:'Processing Document On Chain Creation Event', data })
    try {
      const document = await this.tradeDocumentService.getDocumentById(
        data.accountId,
        data.documentId,
      );
      if (!document) {
        throw new Error(
          `Trade Document with id '${data.documentId}' for account id '${data.accountId}' was not found`,
        );
      }

      if (document.status !== TradeDocumentStatus.ISSUED) {
        throw new Error(
          `Trade Document with id '${data.documentId}' for account id '${data.accountId}' cannot be used for signing as it has a status of ${document.status}.`,
        );
      }
      if (!document.issuedFile) {
        throw new Error(
          `Trade Document with id '${data.documentId}' for account id '${data.accountId}' cannot be used for signing as it does not have an issued document file.`,
        );
      }
      const pdfBuffer = await this.fileStorageService.downloadFile(
        document.issuedFile.storedFileName,
      );
      if (!pdfBuffer) {
        throw new Error(
          `Failed to download the issued File content for Trade Document with id '${data.documentId}' for account id '${data.accountId}'`,
        );
      }

      const signers = data.parties.map((party) => {
        return party.walletAddress;
      });

      const expirationDays = subtractDates(new Date(), data.expiryDate instanceof Date ? data.expiryDate : new Date(data.expiryDate) );

      const eventDocumentId = await this.documentSigningContractService.createDocument(
        pdfBuffer,
        signers,
        expirationDays,
      );

      // Add eventDocumentId to Signing Event
      const payload: UpdateSigningDetailsDto = {
        contractDetails: {
          documentId: eventDocumentId,
          contractAddress: this.documentSigningContractService.getContractAddress(),
          rpcUrl: this.documentSigningContractService.getRpcUrl(),
          chainId: await this.documentSigningContractService.getChainId()
        },
      };
      this.logger.debug(payload);
      const results = await this.documentSigningService.updateById(document.documentSigningId, payload);
      this.logger.debug(results);

      await this.auditService.log({
        subject: AuditSubject.TRADE_DOCUMENT,
        eventType: AuditEventType.ON_CHAIN_SIGNING_EVENT_CREATED,
        identifier: data.documentId,
        details: {
          tradeDocumentId: data.documentId,
          accountId: data.accountId,
          signingDocumentId: eventDocumentId,
          expiryDate: data.expiryDate,
          signers: signers,
        }
      });
    } catch (error) {
      this.logger.debug({message:"Failed to create on-chain signing event", error})
      throw error;
    }
  }

  /**
   * Creates a Document Signing Event in the documentsignings collection and then updates the trade document with
   *  the id created record
   * @param data The Job Data for the Create Document Signing Event
   * @private
   */
  private async processDocumentSigningOffChainEvent(
    data: CreateDocumentSigningEventJobData,
  ) {
    this.logger.log({message:'Processing Document Off Chain Creation Event', data })
    const documentSigningEventDetails =
      await this.documentSigningService.createDocumentSigningOffChainDetails({
        ...data,
      } as DocumentSigningCreationDetailsDto);

    await this.tradeDocumentService.updateProtectedAttributes(
      data.accountId,
      data.documentId,
      { documentSigningId: documentSigningEventDetails.id },
    );
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
  CREATE_DOCUMENT_SIGNING_FINALISE_EVENT,
  CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT,
  CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT,
} from '../../constants/app.constants';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentSigningService } from '../document-signing.service';
import { AuditService } from '../../audit/audit.service';
import { DocumentSigningContractService } from '../document-signing-contract.service';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { CreateDocumentSigningEventJobData } from '../types/signing-events.types';
import { DocumentSigningStatus } from '../types/document-signing.types';
import {
  DocumentSigningCreationDetailsDto,
  DocumentSigningEventContractDetails,
  UpdateSigningDetailsDto,
} from '../dtos/document-signing.dto';
import { TradeDocumentStatus } from '../../types/trade-documents.types';
import { FileStorageService } from '../../file-storage/file-storage.interface';
import { subtractDates } from '../../utils/date-utils';
import { AuditEventType } from '../../audit/audit-event-type.enum';

@Processor(CREATE_DOCUMENT_SIGNING_EVENT_QUEUE)
export class CreateDocumentSigningEventProcessor extends WorkerHost {
  private readonly logger = new Logger(
    CreateDocumentSigningEventProcessor.name,
  );

  constructor(
    private readonly documentSigningService: DocumentSigningService,
    private readonly tradeDocumentService: TradeDocumentsService,
    private readonly documentSigningContractService: DocumentSigningContractService,
    private readonly fileStorageService: FileStorageService,
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
      eventType: AuditEventType.ON_CHAIN_SIGNING_EVENT_OPENED,
      documentId: data.documentId,
      accountId: data.accountId,
      details: {
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
    const expirationDays = subtractDates(new Date(), data.expiryDate);
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
    await this.documentSigningService.updateById(document.documentSigningId, payload);

    await this.auditService.log({
      eventType: AuditEventType.ON_CHAIN_SIGNING_EVENT_CREATED,
      documentId: data.documentId,
      accountId: data.accountId,
      details: {
        signingDocumentId: eventDocumentId,
        expiryDate: data.expiryDate,
        signers: signers,
      }
    });
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

//
// const signingData = await this.documentSigningService.findById(
//   job.data.signingId,
// );
//
// // Get the document to be signed
// const fileDetails = await this.tradeDocumentService.getTradeDocumentFile(
//   signingData.accountId,
//   signingData.documentId,
//   TradeDocumentFileVariant.ISSUED,
// );
//
// const signers = signingData.parties.map((party) => party.walletAddress);
// const expiresAfter = subtractDates(new Date(), signingData.expiryDate);
// const signingDocumentId =
//   await this.documentSigningContractService.createDocument(
//     fileDetails.buffer,
//     signers,
//     expiresAfter,
//   );
//
// const result = await this.documentSigningService.updateById(
//   job.data.signingId,
//   {
//     signingDocumentId: signingDocumentId,
//     lastKnownStatus: DocumentSigningStatus.IN_PROGRESS,
//   },
// );
//
// // Log Document Signing Event Created event
// await this.auditService.log({
//   eventType: AuditEventType.DOCUMENT_SIGNING_EVENT_CREATED,
//   documentId: signingData.documentId,
//   accountId: signingData.accountId,
//   details: {
//     lastKnownStatus: result.lastKnownStatus,
//     expiryDate: result.expiryDate,
//   },
// });
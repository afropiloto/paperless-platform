import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { Inject, Logger } from '@nestjs/common';
import { FILE_STORAGE_SERVICE } from '../../file-storage/file-storage.constants';
import { FileStorageService } from '../../file-storage/file-storage.interface';
import { AuditService } from '../../audit/audit.service';
import { TradeDocumentFileVariant } from '../../trade-documents/trade-document-file.types';
import { ConfigService } from '@nestjs/config';
import { createQRCode } from '../../utils/issued-pdf/createQRCode';
import { generateVerifiablePDF } from '../../utils/issued-pdf/generateVerifiablePDF';
import { computeVerifiableHash } from '../../utils/issued-pdf/document-tracking';
import { AccountsService } from '../../accounts/accounts.service';
import {
  TradeDocumentProtectedAttributesUpdateDto,
} from '../../trade-documents/dtos/trade-document-protected-attributes-update.dto';
import { AuditEventType, AuditSubject } from '../../audit/audit-event-type.enum';
import { ISSUED_FILE_QUEUE } from '../../constants/app.constants';
import { FileData } from '../../types/trade-documents.types';
import { IssueJobData } from '../../common/event-flows/issue-event-flow';

@Processor(ISSUED_FILE_QUEUE)
export class IssuedFileProcessor extends WorkerHost {
  private readonly logger = new Logger(IssuedFileProcessor.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly tradeDocumentsService: TradeDocumentsService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
    private readonly accountsService: AccountsService,
    private readonly auditService: AuditService,
  ) {
    super();
  }
  async process(job: Job<IssueJobData>): Promise<void> {
    const { accountId, documentId, issueDate, documentTrackingId, documentReference } = job.data;

    this.logger.log({
      message: 'Preparing Issued File',
      accountId,
      documentId,
      issueDate,
      documentTrackingId
    });

    const accountDetails =
      await this.accountsService.findByAccountId(accountId);
    if (!accountDetails?.accountName) {
      this.logger.error('Unable to generate Issue File - the Account related to this document does not have an accountName')
      throw new Error(
        'Unable to generate Issue File - the Account related to this document does not have an accountName',
      );
    }
    // get the original file
    const fileDetails =
      await this.tradeDocumentsService.getDocumentFileDetailsById(
        accountId,
        documentId,
        TradeDocumentFileVariant.ORIGINAL,
      );
    if (!fileDetails?.storedFileName) {
      this.logger.error('Unable to generate Issue File - the Trade document does not have an Original file stored')
      throw new Error(
        'Unable to generate Issue File - the Trade document does not have an Original file stored',
      );
    }

    let originalFileBuffer: Buffer;
    const originalFile: FileData = {};
    try {
      originalFileBuffer = await this.fileStorageService.downloadFile(
        fileDetails.storedFileName,
      );
      originalFile.buffer = originalFileBuffer;
      originalFile.originalname = `${documentReference}.pdf`;
      originalFile.mimetype =  fileDetails.mimeType;
      originalFile.size = originalFileBuffer.length;
    } catch(error) {
      this.logger.error({error})
    }

    // generate a new Issue file
    const issuedFile = await this.generateTrackableDocument(
      documentTrackingId,
      accountDetails.accountName,
      issueDate,
      originalFile,
    );

    // store issue file
    await this.tradeDocumentsService.updateTradeDocumentFileById(
      accountId,
      documentId,
      issuedFile,
      TradeDocumentFileVariant.ISSUED,
    );

    // Create document hash and store
    const documentHash = await computeVerifiableHash(issuedFile);
    await this.tradeDocumentsService.updateProtectedAttributes(
      accountId,
      documentId,
      {
        documentTrackingId,
        verifiableDocumentHash: documentHash,
      } as TradeDocumentProtectedAttributesUpdateDto,
    );

    // Create Audit Record
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.TRACKABLE_DOCUMENT_ISSUED,
      identifier: documentId,
      accountId,
      details: {
        documentTrackingId,
        documentHash,
      }
    });
  }

  private async generateTrackableDocument(
    documentTrackingId: string,
    accountName: string,
    issueDate: Date,
    originalFile: FileData,
  ) {
    // Generate QR code
    const verifyUrl = `${this.configService.get<string>('APP_VERIFICATION_URL')}/${documentTrackingId}`;
    const qrCodeBase64 = await createQRCode(verifyUrl);
    // Embed verification information and document into new PDF
    return await generateVerifiablePDF(
      originalFile,
      accountName,
      issueDate,
      documentTrackingId,
      qrCodeBase64,
    );
  }
}
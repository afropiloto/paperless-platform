import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { TradeDocumentFileVariant } from '../../trade-documents/trade-document-file.types';
import { FILE_STORAGE_SERVICE } from '../../file-storage/file-storage.constants';
import { FileStorageService } from '../../file-storage/file-storage.interface';
import { fileBufferToDataUrl, jsonToFileData } from '../../utils/document-utils';
import { getTradeTrustDocumentClass } from '../../trade-trust/trade-trust-utils';
import { TradeTrustFileDetails } from '../../trade-trust/trade-trust.types';
import { IssueDetailsDto } from '../../trade-documents/dtos/trade-document.dto';
import { AuditEventType, AuditSubject } from '../../audit/audit-event-type.enum';
import { TradeTrustService } from '../../trade-trust/trade-trust.service';
import { AuditService } from '../../audit/audit.service';
import { IssueJobData } from '../../common/event-flows/issue-event-flow';
import { TT_FILE_QUEUE } from '../../constants/app.constants';


@Processor(TT_FILE_QUEUE)
export class TtFileProcessor extends WorkerHost {
  private readonly logger = new Logger(TtFileProcessor.name);

  constructor(
    private readonly tradeDocumentsService: TradeDocumentsService,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService,
    private readonly tradeTrustService: TradeTrustService,
    private readonly auditService: AuditService,) {
    super();
  }

  async process(job: Job<IssueJobData>): Promise<void> {
    const { accountId, documentId, isTransferrable, documentReference} = job.data;
    this.logger.log({
      message: 'Preparing .TT File',
      accountId,
      documentId,
      isTransferrable
    });


    const tradeDocumentContent =
      await this.tradeDocumentsService.getDocumentById(
        accountId,
        documentId,
        ['documentType', 'documentContent'],
      );

    if (!tradeDocumentContent.documentContent) {
      this.logger.error({
        message:
          'Unable to produce the .TT file. Document has no content',
        accountId,
        documentId,
      });
      throw new Error('Trade Document does not have any content');
    }

    const tradeDocumentFile =
      await this.tradeDocumentsService.getTradeDocumentFileVariantDetails(
        accountId,
        documentId,
        TradeDocumentFileVariant.ISSUED,
      );
    if (!tradeDocumentFile?.storedFileName) {
      this.logger.error({
        message:
          'Unable to prepare document for issue. Document has no stored File',
        accountId,
        documentId,
      });
      throw new Error('Trade Document does not have any content');
    }
    const fileBuffer = await this.fileStorageService.downloadFile(
      tradeDocumentFile.storedFileName,
    );
    const dataUrl = fileBufferToDataUrl(fileBuffer, tradeDocumentFile.mimeType);

    // Wrap the content
    const documentClass = getTradeTrustDocumentClass(tradeDocumentContent.documentType);
    const attachments = [
      {
        fileName: tradeDocumentFile.originalFileName,
        mimeType: tradeDocumentFile.mimeType,
        dataUrl: dataUrl,
      } as TradeTrustFileDetails,
    ];

    const documentContent = { ...tradeDocumentContent.documentContent };
    const { merkleRoot, wrappedContent } =
      await this.tradeTrustService.wrapDocument(
        documentClass,
        attachments,
        documentContent,
      );
    // Save the merkleRoot and wrappedContent to the database
    const issueDetails: IssueDetailsDto = {
      documentClass,
      merkleRoot,
    };

    await this.tradeDocumentsService.updateTradeDocumentIssueDetails(
      accountId,
      documentId,
      issueDetails,
    );

    // Store the .TT file
    const ttFile = jsonToFileData(wrappedContent, `${documentReference}.tt`)
    await this.tradeDocumentsService.updateTradeDocumentFileById(
      accountId,
      documentId,
      ttFile,
      TradeDocumentFileVariant.TRADE_TRUST,
    );
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.DOCUMENT_WRAPPED,
      identifier: documentId,
      accountId,
      details: { message: 'Content wrapped and .TT file created' },
    });

  }
} 
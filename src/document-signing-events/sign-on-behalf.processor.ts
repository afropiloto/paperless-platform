import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentSigningService } from '../document-signing/document-signing.service';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { DocumentSigningContractService } from '../document-signing/document-signing-contract.service';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { TradeDocumentFileVariant } from '../trade-documents/trade-document-file.types';
import { getPaperlessSigner } from '../utils/web3-utils';
import { SignDocumentOnBehalfJobData } from '../document-signing/types/signing-events.types';
import { SIGN_DOCUMENT_ON_BEHALF_QUEUE } from '../constants/app.constants';


@Processor(SIGN_DOCUMENT_ON_BEHALF_QUEUE)
export class SignOnBehalfOfPaperless extends WorkerHost {
  private readonly logger = new Logger(
    SignOnBehalfOfPaperless.name,
  );

  constructor(
    private readonly documentSigningService: DocumentSigningService,
    private readonly tradeDocumentService: TradeDocumentsService,
    private readonly documentSigningContractService: DocumentSigningContractService,
    private readonly auditService: AuditService,
  ) {
    super();
  }

  /**
   * Signs a Document on behalf of Paperless
   * @param job
   */
  async process(job: Job<SignDocumentOnBehalfJobData>): Promise<void> {
    // Get the signing event details
    const signingDetails = await this.documentSigningService.findById(job.data.signingId);
    if (!signingDetails) {
      throw new Error (`Document Signing Details were not found for signing id ${job.data.signingId}`);
    }
    const tradeDocumentId = signingDetails.documentId;
    const accountId = signingDetails.accountId;
    const documentSigningId = signingDetails.contractDetails.documentId;

    // Get the document to be signed
    const fileDetails = await this.tradeDocumentService.getTradeDocumentFile(accountId, tradeDocumentId, TradeDocumentFileVariant.ISSUED)

    const signer = getPaperlessSigner(this.documentSigningContractService.getProvider());

    const receipt = await this.documentSigningContractService.signDocument(
      documentSigningId,
      fileDetails.buffer,
      signer
    )

    // Log Audit Record
    await this.auditService.log({
      subject: AuditSubject.TRADE_DOCUMENT,
      eventType: AuditEventType.DOCUMENT_SIGNED_ON_BEHALF,
      identifier: tradeDocumentId,
      details: {
        accountId, tradeDocumentId,
        transactionHash: receipt.transactionHash,
        documentSigningId: documentSigningId,
        signedBy: await signer.getAddress()
      },
    });
  }
}
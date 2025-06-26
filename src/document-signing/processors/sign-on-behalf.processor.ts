import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DocumentSigningService } from '../document-signing.service';
import { AuditService } from '../../audit/audit.service';
import { AuditEventType } from '../../audit/audit-event-type.enum';
import { DocumentSigningContractService } from '../document-signing-contract.service';
import { TradeDocumentsService } from '../../trade-documents/trade-documents.service';
import { TradeDocumentFileVariant } from '../../trade-documents/trade-document-file.types';
import { getPaiperlessSigner } from '../../utils/web3-utils';
import {SignDocumentOnBehalfJobData } from '../types/signing-events.types';
import { SIGN_DOCUMENT_ON_BEHALF_QUEUE } from '../../constants/app.constants';



@Processor(SIGN_DOCUMENT_ON_BEHALF_QUEUE)
export class SignOnBehalfOfPaiperless extends WorkerHost {
  private readonly logger = new Logger(
    SignOnBehalfOfPaiperless.name,
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
   * Signs a Document on behalf of Paiperless
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
    const documentSigningId = signingDetails.signingDocumentId;

    // Get the document to be signed
    const fileDetails = await this.tradeDocumentService.getTradeDocumentFile(accountId, tradeDocumentId, TradeDocumentFileVariant.ISSUED)

    const signer = getPaiperlessSigner(this.documentSigningContractService.getProvider());

    const receipt = await this.documentSigningContractService.signDocument(
      documentSigningId,
      fileDetails.buffer,
      signer
    )

    // Log Audit Record
    await this.auditService.log({
      eventType: AuditEventType.DOCUMENT_SIGNED_ON_BEHALF,
      documentId: tradeDocumentId,
      accountId: accountId,
      details: {
        transactionHash: receipt.transactionHash,
        documentSigningId: documentSigningId,
        signedBy: await signer.getAddress()
      },
    });
  }
}
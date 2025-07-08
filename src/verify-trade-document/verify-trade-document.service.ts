import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TradeDocumentVerificationResultsDto } from './dtos/verify-trade-document.dto';
import {
  computeDocumentHashFromDataUrl,
  extractDocumentTrackingId,
  fileToDataUrl,
} from '../utils/document-utils';
import { AccountsRepository } from '../accounts/accounts.repository';
import { TradeDocumentsRepository } from '../trade-documents/trade-documents.repository';
import { TradeDocumentFileVariant } from '../trade-documents/trade-document-file.types';

@Injectable()
export class VerifyTradeDocumentService {
  private readonly logger = new Logger(VerifyTradeDocumentService.name);

  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly tradeDocumentsRepository: TradeDocumentsRepository,
  ) {}

  async verifyTradeDocument(
    file: Express.Multer.File,
  ): Promise<TradeDocumentVerificationResultsDto> {
    // Extract Tracking Id from the file
    const { documentTrackingId, documentHash } =
      await this.extractVerificationDetailsFromFile(file);

    if (!documentTrackingId || !documentHash) {
      return {
        validationSuccess: false,
        errorMessage: 'Document Tracking ID could not be detected',
      } as TradeDocumentVerificationResultsDto;
    }

    // Check the document verifies
    return this.performVerification(documentTrackingId, documentHash);
  }

  private async extractVerificationDetailsFromFile(file: Express.Multer.File) {
    const dataUrl = fileToDataUrl(file);
    try {
      const computedDocumentHash = computeDocumentHashFromDataUrl(dataUrl);
      const extractedTrackingId = await extractDocumentTrackingId(dataUrl);

      return {
        documentTrackingId: extractedTrackingId,
        documentHash: computedDocumentHash,
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to extract verification details from file',
        error: error.message,
      });
      return {
        documentTrackingId: undefined,
        documentHash: undefined,
      };
    }
  }

  private async performVerification(
    documentTrackingId: string,
    fileDocumentHash: string,
  ): Promise<TradeDocumentVerificationResultsDto> {
    // Retrieve the stored Trade Document Details
    const verificationDetails =
      await this.tradeDocumentsRepository.getDocumentByTrackingId(
        documentTrackingId,
        ['verifiableDataUrlHash', 'issueDetails', 'accountId'],
        [],
      );
    if (!verificationDetails) {
      this.logger.error({
        message: 'failed to obtain verification details',
        documentTrackingId,
      });
      return {
        validationSuccess: false,
        documentIssued: false,
        errorMessage: 'Document Tracking ID not matched to an issued document',
      } as TradeDocumentVerificationResultsDto;
    }
    // Compare hashes
    if (fileDocumentHash !== verificationDetails.verifiableDocumentHash) {
      return {
        validationSuccess: false,
        documentHashMatches: false,
        errorMessage: 'Document integrity could not be verified',
      } as TradeDocumentVerificationResultsDto;
    }
    // Document verified - retrieve account name
    const accountDetails = await this.accountsRepository.findAccountById(
      verificationDetails.accountId,
    );

    return {
      validationSuccess: true,
      documentHashMatches: true,
      documentIssued: true,
      issuedBy: accountDetails.accountName,
      issueDate: verificationDetails.issueDetails.dateIssued,
    } as TradeDocumentVerificationResultsDto;
  }

  async getTradeDocumentByTrackingId(trackingId: string) {
    const document =
      await this.tradeDocumentsRepository.getDocumentByTrackingId(
        trackingId,
        [],
        [
          'wrappedContent',
          'verifiableDataUrlHash',
          'tradeDocumentFile',
          'merkleRoot',
        ],
      );
    if (!document) {
      throw new NotFoundException(
        `Trade document with tracking id ${trackingId} not found`,
      );
    }
    return document;
  }

  async getTradeDocumentFileByTrackingId(trackingId: string) {
    const document =
      await this.tradeDocumentsRepository.getDocumentFileDetailsByTrackingId(
        trackingId,
        TradeDocumentFileVariant.ISSUED,
      );
    if (!document) {
      throw new NotFoundException(
        `Trade document with tracking id ${trackingId} not found`,
      );
    }
    return document;
  }
}

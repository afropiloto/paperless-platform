import { Injectable, Logger } from '@nestjs/common';
import { TradeDocumentStatus, TradeDocumentType } from '../../types/trade-documents.types';
import { TradeTrustDocumentClass } from '../../trade-trust/trade-trust.types';
import { getTradeTrustDocumentClass } from '../../trade-trust/trade-trust-utils';
import { MletrDocumentAttributes } from '../types/dvp-settlement.types';

export interface MletrValidationResult {
  compliant: boolean;
  notes: string[];
  attributes: MletrDocumentAttributes;
}

@Injectable()
export class MletrDocumentService {
  private readonly logger = new Logger(MletrDocumentService.name);

  /**
   * Validates a trade document against mLETR requirements for electronic transferable records.
   * mLETR requires: reliability of the system, identification of the record,
   * retention of integrity, and ability to transfer control (possession).
   */
  validateForMletr(
    documentType: string,
    documentContent: Record<string, unknown> | undefined,
    issueDetails: {
      documentClass?: TradeTrustDocumentClass;
      merkleRoot?: string;
      transactionHash?: string;
    } | undefined,
    status: string,
    governingLaw?: string,
  ): MletrValidationResult {
    const notes: string[] = [];
    let compliant = true;

    const documentClass = getTradeTrustDocumentClass(documentType);
    const isTransferable = documentClass === TradeTrustDocumentClass.TRANSFERABLE;

    if (status !== TradeDocumentStatus.ISSUED) {
      notes.push('Document must be issued before DvP settlement');
      compliant = false;
    }

    if (!issueDetails?.merkleRoot) {
      notes.push('Document lacks cryptographic integrity proof (merkle root)');
      compliant = false;
    }

    if (isTransferable && !issueDetails?.transactionHash) {
      notes.push('Transferable eTR must be minted on token registry');
      compliant = false;
    }

    if (!documentContent || Object.keys(documentContent).length === 0) {
      notes.push('Document content not populated — AI parsing recommended');
      compliant = false;
    }

    const { documentReference, sellerParty, buyerParty } =
      this.extractPartiesFromContent(documentType, documentContent);

    if (!documentReference) {
      notes.push('Document reference could not be extracted from parsed content');
    }

    const attributes: MletrDocumentAttributes = {
      governingLaw: governingLaw ?? 'UNCITRAL Model Law on Electronic Transferable Records (mLETR)',
      isElectronicTransferableRecord: isTransferable,
      controlMethod: isTransferable ? 'TOKEN_REGISTRY' : 'VERIFIABLE_RECORD',
      documentReference,
      sellerParty,
      buyerParty,
    };

    if (isTransferable) {
      notes.push('Document qualifies as mLETR electronic transferable record via TrustVC token registry');
    } else {
      notes.push('Document is verifiable record — DvP applies to payment against document release, not title transfer');
    }

    this.logger.debug({ message: 'mLETR validation complete', compliant, documentType, documentReference });

    return { compliant, notes, attributes };
  }

  extractSettlementAmount(
    documentType: string,
    documentContent: Record<string, unknown> | undefined,
  ): { amount: string; currency: string } | null {
    if (!documentContent) return null;

    switch (documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE: {
        const total = documentContent['invoiceTotal'] ?? documentContent['total'];
        const currency = documentContent['currencyCode'] ?? 'USD';
        if (total != null) {
          return { amount: String(total), currency: String(currency) };
        }
        break;
      }
      case TradeDocumentType.BILL_OF_EXCHANGE: {
        const amount = documentContent['amountInNumbers'];
        const currency = documentContent['currency'] ?? 'USD';
        if (amount != null) {
          return { amount: String(amount), currency: String(currency) };
        }
        break;
      }
      case TradeDocumentType.BILL_OF_LADING: {
        const freight = documentContent['freightCharges'];
        if (freight && typeof freight === 'object') {
          const fc = freight as Record<string, unknown>;
          if (fc['value'] != null) {
            return {
              amount: String(fc['value']),
              currency: String(fc['currency'] ?? 'USD'),
            };
          }
        }
        break;
      }
      default:
        break;
    }
    return null;
  }

  private extractPartiesFromContent(
    documentType: string,
    documentContent: Record<string, unknown> | undefined,
  ): { documentReference?: string; sellerParty?: string; buyerParty?: string } {
    if (!documentContent) return {};

    switch (documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE:
        return {
          documentReference: documentContent['invoiceNumber'] as string,
          sellerParty: (documentContent['billFrom'] as Record<string, unknown>)?.['companyName'] as string,
          buyerParty: (documentContent['billTo'] as Record<string, unknown>)?.['companyName'] as string,
        };
      case TradeDocumentType.BILL_OF_LADING:
        return {
          documentReference: documentContent['blNumber'] as string,
          sellerParty: (documentContent['consignor'] as Record<string, unknown>)?.['name'] as string,
          buyerParty: (documentContent['consignee'] as Record<string, unknown>)?.['name'] as string,
        };
      case TradeDocumentType.BILL_OF_EXCHANGE:
        return {
          documentReference: documentContent['boeReference'] as string,
          sellerParty: (documentContent['drawer'] as Record<string, unknown>)?.['nameOfAuthorisedSignatory'] as string,
          buyerParty: documentContent['payToTheOrder'] as string,
        };
      default:
        return {
          documentReference: documentContent['title'] as string,
        };
    }
  }
}

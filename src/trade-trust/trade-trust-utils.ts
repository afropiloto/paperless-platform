import { TradeTrustDocumentClass } from './trade-trust.types';
import { TradeDocumentType } from '../types/trade-documents.types';

export function getTradeTrustDocumentClass(
  tradeDocumentType: string,
): TradeTrustDocumentClass {
  switch (tradeDocumentType.toLowerCase()) {
    case TradeDocumentType.INVOICE.toLowerCase():
      return TradeTrustDocumentClass.TRANSFERABLE;
    case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
      return TradeTrustDocumentClass.TRANSFERABLE;
    case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
      return TradeTrustDocumentClass.TRANSFERABLE;
    case TradeDocumentType.BILL_OF_LADING.toLowerCase():
      return TradeTrustDocumentClass.TRANSFERABLE;
    case TradeDocumentType.OTHER.toLowerCase():
      return TradeTrustDocumentClass.VERIFIABLE;
    default:
      return TradeTrustDocumentClass.VERIFIABLE;
  }
}
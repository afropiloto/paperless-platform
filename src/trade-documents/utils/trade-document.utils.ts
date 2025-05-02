import { TradeDocumentType } from '../../types/trade-documents.types';

export function getTradeDocumentContentField(tradeDocumentType: string): string {
  switch (tradeDocumentType.toLowerCase()) {
    case TradeDocumentType.INVOICE.toLowerCase():
      return "invoiceContent";
    case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
      return "billOfExchangeContent";
    case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
      return "promissoryNoteContent";
    case TradeDocumentType.OTHER.toLowerCase():
      return "otherDocumentContent";
    default:
      return "";
  }
}

export function getUnsets(tradeDocumentType: string) {
  switch (tradeDocumentType.toLowerCase()) {
    case TradeDocumentType.INVOICE.toLowerCase():
      return {
        billOfExchangeContent: '',
        promissoryNoteContent: '',
        otherDocumentContent: '',
      };
    case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
      return {
        invoiceContent: '',
        promissoryNoteContent: '',
        otherDocumentContent: '',
      };
    case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
      return {
        billOfExchangeContent: '',
        invoiceContent: '',
        otherDocumentContent: '',
      };
    case TradeDocumentType.OTHER.toLowerCase():
      return {
        billOfExchangeContent: '',
        invoiceContent: '',
        promissoryNoteContent: '',
        claimants: '',
      };
    default:
      return {};
  }
}
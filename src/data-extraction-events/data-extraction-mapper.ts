import { TradeDocumentType } from '../types/trade-documents.types';
import {
  BillOfExchangeContentDto,
  BillOfLadingContentDto,
  InvoiceContentDto,
  PromissoryNoteContentDto,
  WarehouseReceiptContentDto,
} from '../trade-documents/dtos/trade-document.dto';
import { ProcessorOutput } from 'extend-ai/api';

export function mapToDocumentContent(extractedData:  ProcessorOutput, documentType: TradeDocumentType): InvoiceContentDto | BillOfExchangeContentDto | BillOfLadingContentDto | PromissoryNoteContentDto | WarehouseReceiptContentDto {
  switch (documentType) {
    case TradeDocumentType.INVOICE:
      return mapToInvoice(extractedData);
    case TradeDocumentType.BILL_OF_LADING:
      return mapToBillOfLading(extractedData);
    case TradeDocumentType.BILL_OF_EXCHANGE:
      return mapToBillOfExchange(extractedData);
    case TradeDocumentType.PROMISSORY_NOTE:
      return mapToPromissoryNote(extractedData);
    case TradeDocumentType.WAREHOUSE_RECEIPT:
      return mapToWarehouseReceipt(extractedData);
    default:
      throw new Error(`Document Type '${documentType}' not supported for document extraction mapping `);
  }
}

function mapToInvoice(extractedData:  ProcessorOutput): InvoiceContentDto {
  if ('value' in extractedData) {
    const extractedOutput = extractedData.value;


    const mappedData: InvoiceContentDto = {
      invoiceNumber: extractedOutput['invoiceNumber'],
      dueDate: extractedOutput['dueDate'],
      invoiceDate: extractedOutput['invoiceDate'],
      terms: extractedOutput['terms'],
      currencyCode: extractedOutput['currencyCode'],
      billFrom: {
        companyName: extractedOutput['billFrom']["companyName"],
        streetAddress: extractedOutput['billFrom']['streetAddress'],
        city: extractedOutput['billFrom']['city'],
        postalCode: extractedOutput['billFrom']['postalCode'],
        contactNumber: extractedOutput['billFrom']['contactNumber'],
        contactEmail: extractedOutput['billFrom']['contactEmail'],
      },
      billTo: {
        companyName: extractedOutput['billTo']["companyName"],
        streetAddress: extractedOutput['billTo']['streetAddress'],
        city: extractedOutput['billTo']['city'],
        postalCode: extractedOutput['billTo']['postalCode'],
        contactNumber: extractedOutput['billTo']['contactNumber'],
        contactEmail: extractedOutput['billTo']['contactEmail'],
      },
      billableItems: extractedOutput['billableItems'].map((item) => {
        return {
          description: item['description'],
          amount: item['amount'],
          quantity: item['quantity'],
          unitPrice: item['unitPrice'],
        }
      }),
      invoiceTotal: extractedOutput['invoiceTotal']
    }

    return mappedData;
  }
  else {
    throw new Error("The extracted data did not include the value object (processorRun.output.value)")
  }

}

function mapToBillOfLading(extractedData: ProcessorOutput): BillOfLadingContentDto {
  if ('value' in extractedData) {
    const extractedOutput = extractedData.value;


    const mappedData: BillOfLadingContentDto = {
      blNumber: extractedOutput['blNumber'],
      issueDate: extractedOutput['issueDate'],
      shipperReference: extractedOutput['shipperReference'],
      carrier:{
        name: extractedOutput['carrier']["companyName"],
        address: extractedOutput['carrier']['address'],
        country: extractedOutput['carrier']['country'],
        contactEmail: extractedOutput['carrier']['contactEmail'],
      },
      consignee: {
        name: extractedOutput['consignee']["companyName"],
        address: extractedOutput['consignee']['address'],
        country: extractedOutput['consignee']['country'],
        contactEmail: extractedOutput['consignee']['contactEmail'],
      },
      consignor: {
        name: extractedOutput['consignor']["companyName"],
        address: extractedOutput['consignor']['address'],
        country: extractedOutput['consignor']['country'],
        contactEmail: extractedOutput['consignor']['contactEmail'],
      },
      charges: {
        currency: extractedOutput['charges']['currencyCode'],
        totalFreight: extractedOutput['charges']['totalFreight'],
        otherCharges: extractedOutput['charges']['otherCharges'],
        insurance: extractedOutput['charges']['insurance'],
        handlingFees: extractedOutput['charges']['handlingFees'],
      },
      documents: {
        invoiceNumber: extractedOutput['documents']['invoiceNumber'],
        insuranceCertificate: extractedOutput['documents']['insuranceCertificate'],
        packingList: extractedOutput['documents']['packingList'],
        customsDeclaration: extractedOutput['documents']['customsDeclaration'],
      },
      shipmentDetails: {
        cargoDescription: extractedOutput['shipmentDetails']['cargoDescription'],
        estimatedTimeOfArrival: extractedOutput['shipmentDetails']['estimatedTimeOfArrival'],
        estimatedTimeOfDeparture: extractedOutput['shipmentDetails']['estimatedTimeOfDeparture'],
        placeOfReceipt: extractedOutput['shipmentDetails']['placeOfReceipt'],
        placeOfDelivery: extractedOutput['shipmentDetails']['placeOfDelivery'],
        portOfDischarge: extractedOutput['shipmentDetails']['portOfDischarge'],
        portOfLoading: extractedOutput['shipmentDetails']['portOfLoading'],
        freightTerms: extractedOutput['shipmentDetails']['freightTerms'],
        vesselName: extractedOutput['shipmentDetails']['vesselName'],
        voyageNumber: extractedOutput['shipmentDetails']['voyageNumber'],
        weightKgs: extractedOutput['shipmentDetails']['weightKgs'],
        volumeCubicMetres: extractedOutput['shipmentDetails']['volumeCubicMetres'],
      },
      containerInfo: extractedOutput['containerInfo'].map((container) => {
        return {
          containerNumber: container['containerNumber'],
          containerType: container['containerType'],
          sealNumber: container['sealNumber'],
          size: container['size'],
        }
      }),
    }

    return mappedData;
  }
  else {
    throw new Error("The extracted data did not include the value object (processorRun.output.value)")
  }
}

function mapToBillOfExchange(extractedData:  ProcessorOutput): BillOfExchangeContentDto {
  if ('value' in extractedData) {
    const extractedOutput = extractedData.value;


    const mappedData: BillOfExchangeContentDto = {
      boeReference: extractedOutput['boeReference'],
      issueDate: extractedOutput['issueDate'],
      issuedBy: extractedOutput['issuedBy'],
      amount: extractedOutput['amount'],
      dueDate: extractedOutput['dueDate'],
      placeOfIssue: extractedOutput['placeOfIssue'],
      termsAndConditions: extractedOutput['termsAndConditions'],
      payableTo: {
        name: extractedOutput['payableTo']['name'],
        contactEmail: extractedOutput['payableTo']['contactEmail'],
        address: extractedOutput['payableTo']['address'],
        country: extractedOutput['payableTo']['country'],
      }
    }

    return mappedData;
  }
  else {
    throw new Error("The extracted data did not include the value object (processorRun.output.value)")
  }
}

function mapToPromissoryNote(extractedData:  ProcessorOutput): PromissoryNoteContentDto {
  if ('value' in extractedData) {
    const extractedOutput = extractedData.value;


    const mappedData: PromissoryNoteContentDto = {
      noteReference: extractedOutput['noteReference'],
      issueDate: extractedOutput['issueDate'],
      maturityDate: extractedOutput['maturityDate'],
      specialConditions: extractedOutput['specialConditions'],
      borrower: {
        name: extractedOutput['borrower']['name'],
        address: extractedOutput['borrower']['address'],
        country: extractedOutput['borrower']['country'],
        contactEmail: extractedOutput['borrower']['contactEmail'],
      },
      lender: {
        name: extractedOutput['lender']['name'],
        address: extractedOutput['lender']['address'],
        country: extractedOutput['lender']['country'],
        contactEmail: extractedOutput['lender']['contactEmail'],
      },
      loanDetails: {
        amount: extractedOutput['loanDetails']['amount'],
        interestRate: extractedOutput['loanDetails']['interestRate'],
        paymentTerms: extractedOutput['loanDetails']['paymentTerms'],
        placeOfPayment:extractedOutput['loanDetails']['placeOfPayment'],

      }
    }

    return mappedData;
  }
  else {
    throw new Error("The extracted data did not include the value object (processorRun.output.value)")
  }
}

function mapToWarehouseReceipt(extractedData:  ProcessorOutput): WarehouseReceiptContentDto {
  if ('value' in extractedData) {
    const extractedOutput = extractedData.value;


    const mappedData: WarehouseReceiptContentDto = {
      receiptNumber: extractedOutput['receiptNumber'],
      issueDate: extractedOutput['issueDate'],
      warehouseDetails: {
        name: extractedOutput['warehouseDetails']['name'],
        address: extractedOutput['warehouseDetails']['address'],
        country: extractedOutput['warehouseDetails']['country'],
        contactEmail: extractedOutput['warehouseDetails']['contactEmail'],
      },
      consigneeDetails: {
        name: extractedOutput['consigneeDetails']['name'],
        address: extractedOutput['consigneeDetails']['address'],
        country: extractedOutput['consigneeDetails']['country'],
        contactEmail: extractedOutput['consigneeDetails']['contactEmail'],
      },
      consignorDetails:{
        name: extractedOutput['consignorDetails']['name'],
        address: extractedOutput['consignorDetails']['address'],
        country: extractedOutput['consignorDetails']['country'],
        contactEmail: extractedOutput['consignorDetails']['contactEmail'],
      },
      documents: {
        invoiceNumber: extractedOutput['documents']['invoiceNumber'],
        insuranceCertificateNumber: extractedOutput['documents']['insuranceCertificateNumber'],
        packingListNumber: extractedOutput['documents']['packingListNumber'],
        customsDeclarationNumber: extractedOutput['documents']['customsDeclarationNumber'],
      },
      receiptTerms: {
        liability: extractedOutput['receiptTerms']['liability'],
        returnPolicy: extractedOutput['receiptTerms']['returnPolicy'],
      },
      deliveryTerms: {
        deliveryAddress: extractedOutput['deliveryTerms']['deliveryAddress'],
        deliveryContact: extractedOutput['deliveryTerms']['deliveryContact'],
        deliveryInstructions: extractedOutput['deliveryTerms']['deliveryInstructions'],
        deliveryDate: extractedOutput['deliveryTerms']['deliveryDate'],
      },
      storageTerms: {
        storageFeePerDay: extractedOutput['storageTerms']['storageFeePerDay'],
        currency: extractedOutput['storageTerms']['currency'],
        storageStartDate: extractedOutput['storageTerms']['storageStartDate'],
        storageEndDate: extractedOutput['storageTerms']['storageEndDate'],
        specialConditions: extractedOutput['storageTerms']['specialConditions'],
      },
      goodsDetails: {
        description: extractedOutput['goodsDetails']['description'],
        quantity: extractedOutput['goodsDetails']['quantity'],
        unit: extractedOutput['goodsDetails']['unit'],
        volumePerUnitCubicMetres: extractedOutput['goodsDetails']['volumePerUnitCubicMetres'],
        weightPerUnitKgs: extractedOutput['goodsDetails']['weightPerUnitKgs'],
        totalVolumeCubicMetres: extractedOutput['goodsDetails']['totalVolumeCubicMetres'],
        totalWeightKgs: extractedOutput['goodsDetails']['totalWeightKgs'],
      }
    }
    return mappedData;
  }
  else {
    throw new Error("The extracted data did not include the value object (processorRun.output.value)")
  }
}


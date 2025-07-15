import { ApiProperty } from '@nestjs/swagger';
import {  Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

import {
  TradeDocumentStatus,
  TradeDocumentType,
} from '../../types/trade-documents.types';
import { TradeTrustDocumentClass } from '../../trade-trust/trade-trust.types';
import { TradeDocumentFileDTO } from './trade-document-file.dto';


// *****************************************************************************
// Common DTOs
// *****************************************************************************
export class DocumentAmountDto {
  @ApiProperty({ description: 'The value for the document or item' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  value: number;

  @ApiProperty({ description: 'Currency code for the value' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class PartyDetailsDto {
  @ApiProperty({ description: 'Company Name' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Address of Company' })
  @Expose()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Country of residence' })
  @Expose()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Contact Email address for company' })
  @Expose()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;
}

// *****************************************************************************
// Promissory Note DTO
// *****************************************************************************
export class PromissoryNoteLoanDetailsDto {
  @ApiProperty({ description: 'Promise Amount' })
  @Expose()
  @IsNumber()
  @Type(() => DocumentAmountDto)
  amount: DocumentAmountDto;

  @ApiProperty({ description: 'Place of Payment' })
  @Expose()
  @IsString()
  @IsOptional()
  placeOfPayment?: string;

  @ApiProperty({ description: 'Interest Rate for Loan' })
  @Expose()
  @IsNumber()
  interestRate: number;

  @ApiProperty({ description: 'Payment Terms' })
  @Expose()
  @IsString()
  paymentTerms: string;

}



// *****************************************************************************
// Invoice Details DTO
// *****************************************************************************
export class InvoicePartyDetailsDto {
  @ApiProperty({ description: 'Company Name' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'Company Address' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiProperty({ description: 'Address City' })
  @Expose()
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({ description: 'Address Postal Code' })
  @Expose()
  @IsString()
  @IsOptional()
  postalCode: string;

  @ApiProperty({ description: 'Contact Number for company' })
  @Expose()
  @IsString()
  @IsOptional()
  contactNumber: string;

  @ApiProperty({ description: 'Contact Email for company' })
  @Expose()
  @IsString()
  @IsOptional()
  contactEmail: string;
}

export class BillableItemDto {
  @ApiProperty({ description: 'Item Description' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @Expose()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Item Unit Price' })
  @Expose()
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Total Item Amount' })
  @Expose()
  @IsNumber()
  amount: number;
}

// *****************************************************************************
// Other Document Details DTO
// *****************************************************************************
export class OtherDocumentDetailsDto {
  @ApiProperty({ description: 'Document Title' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Date Of Issue' })
  @Expose()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  issueDate?: string;

  @ApiProperty({ description: 'Expiry Date' })
  @Expose()
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: string;

  @ApiProperty({ description: 'Document Description' })
  @Expose()
  @IsString()
  @IsOptional()
  description: string;
}

// *****************************************************************************
// Trade Document Response DTO
// *****************************************************************************
export class TradeDocumentClaimantDetailsDto {
  @ApiProperty({ description: 'Claimant Wallet Address' })
  @Expose()
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({ description: 'Name of Claimant' })
  @Expose()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Email Address of Claimant' })
  @Expose()
  @IsEmail()
  @IsOptional()
  contactEmail?: string;
}

export class TradeDocumentClaimantsDto {
  @ApiProperty({ description: 'Holder Details' })
  @Expose()
  @IsOptional()
  @Type(() => TradeDocumentClaimantDetailsDto)
  owner: TradeDocumentClaimantDetailsDto;

  @ApiProperty({ description: 'Holder Details' })
  @Expose()
  @IsOptional()
  @Type(() => TradeDocumentClaimantDetailsDto)
  beneficiary: TradeDocumentClaimantDetailsDto;
}

export class IssueDetailsDto {
  @ApiProperty({ description: 'Issue Document Class' })
  @Expose()
  @IsEnum(TradeTrustDocumentClass)
  documentClass?: TradeTrustDocumentClass;

  @ApiProperty({ description: 'Date Issued' })
  @Expose()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  dateIssued?: Date;

  @ApiProperty({ description: 'Chain ID the document was issued on' })
  @Expose()
  chainId?: number;

  @ApiProperty({
    description: 'Smart Contract Address Holding the Issued Document',
  })
  @Expose()
  contractAddress?: string;

  @ApiProperty({ description: 'Issue Receipt Transaction Hash' })
  @Expose()
  transactionHash?: string;

  @ApiProperty({ description: 'Hash for Issued Document' })
  @Expose()
  merkleRoot?: string;

  @ApiProperty({ description: 'Wrapped Content for the document' })
  @Expose()
  wrappedContent?: string;
}

// *****************************************************************************
// Content DTOs
// *****************************************************************************
export class InvoiceContentDto {
  @ApiProperty({ description: 'Invoice Number' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiProperty({ description: 'Due Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dueDate: Date;

  @ApiProperty({ description: 'Terms' })
  @Expose()
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiProperty({ description: 'Currency Code' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty({ description: 'Total Amount' })
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  invoiceTotal: number;

  @ApiProperty({ description: 'Bill From Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => InvoicePartyDetailsDto)
  billFrom: InvoicePartyDetailsDto;

  @ApiProperty({ description: 'Bill To Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => InvoicePartyDetailsDto)
  billTo: InvoicePartyDetailsDto;

  @ApiProperty({ description: 'Billable Items' })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillableItemDto)
  billableItems: BillableItemDto[];
}

// *****************************************************************************
//Bill Of Lading Content DTO
// *****************************************************************************
export class BolContainerDetails {
  @ApiProperty({description: 'Container number holding the cargo', example:"CONT1234"})
  @Expose()
  @IsString()
  containerNumber: string;

  @ApiProperty({description: 'The type of container', example:"40ft Standard"})
  @Expose()
  @IsString()
  containerType: string;

  @ApiProperty({description: 'Seal Number on the Container', example:"SEAL9876"})
  @Expose()
  @IsString()
  sealNumber: string;

  @ApiProperty({description: 'Container size', example:"40 ft"})
  @Expose()
  @IsString()
  size: string;
}

export class BolShipmentDetails {
  @ApiProperty({description: 'Port of Loading', example:"Port of Felixstowe, UK"})
  @Expose()
  @IsString()
  portOfLoading: string;

  @ApiProperty({description: 'Port of Discharge', example:"Port of New Orleans, USA"})
  @Expose()
  @IsString()
  portOfDischarge: string;

  @ApiProperty({description: 'Place of Receipt', example:"Warehouse A, New Orleans, USA"})
  @Expose()
  @IsString()
  placeOfReceipt: string;

  @ApiProperty({description: 'Place of Delivery', example:"Warehouse B, New Orleans, USA"})
  @Expose()
  @IsString()
  placeOfDelivery: string;

  @ApiProperty({description: 'Vessel Name', example:"Vessel 101"})
  @Expose()
  @IsString()
  vesselName: string;

  @ApiProperty({description: 'Voyage Number', example:"VOY-101"})
  @Expose()
  @IsString()
  voyageNumber: string;

  @ApiProperty({description: 'Estimated date and time of departure', example:"2025-08-01T00:00:00.000Z"})
  @Expose()
  @IsDate()
  estimatedTimeOfDeparture: Date;

  @ApiProperty({description: 'Estimated date and time of arrival', example:"2025-09-01T00:00:00.000Z"})
  @Expose()
  @IsDate()
  estimatedTimeOfArrival: Date;

  @ApiProperty({description: 'Terms for freight', example:"CIF"})
  @Expose()
  @IsString()
  freightTerms: string;

  @ApiProperty({description: 'Description of Cargo', example:"Electronics and Machinery"})
  @Expose()
  @IsString()
  cargoDescription: string;

  @ApiProperty({description: 'Weight of Cargo in Kgs', example:10000})
  @Expose()
  @IsNumber()
  weightKgs: number;

  @ApiProperty({description: 'Volume of Cargo in cubic metres', example:50})
  @Expose()
  @IsNumber()
  volumeCubicMetres: number;
}

export class BolCharges {
  @ApiProperty({description: 'Charge for Freight', example: 5000})
  @Expose()
  @IsNumber()
  totalFreight: number;

  @ApiProperty({description: 'Charge for Insurance', example: 200})
  @Expose()
  @IsNumber()
  insurance: number;

  @ApiProperty({description: 'Charge for Handling Fees', example: 150})
  @Expose()
  @IsNumber()
  handlingFees: number;

  @ApiProperty({description: 'Other Charges', example: 100})
  @Expose()
  @IsNumber()
  otherCharges: number;

  @ApiProperty({description: 'Currency for Charges', example: "USD"})
  @Expose()
  @IsString()
  currency: string;
}
export class BolDocuments {
  @ApiProperty({description: 'Invoice Number related to this Bill of Lading', example: "INV-001"})
  @Expose()
  @IsString()
  invoiceNumber: string;

  @ApiProperty({description: 'Packing List Number related to this Bill of Lading', example: "PACK-001"})
  @Expose()
  @IsString()
  packingList: string;

  @ApiProperty({description: 'Insurance Certificate Number related to this Bill of Lading', example: "INS-001"})
  @Expose()
  @IsString()
  insuranceCertificate: string;

  @ApiProperty({description: 'Customs Declaration Number related to this Bill of Lading', example: "CD001"})
  @Expose()
  @IsString()
  customsDeclaration: string;
}

export class BillOfLadingContentDto {
  @ApiProperty({description: 'Bill of Exchange Number', example: "EBL001"})
  @Expose()
  @IsString()
  blNumber: string;

  @ApiProperty({description: 'Date of Issue for this Bill of Lading', example: "2025-15-08T00:00:00.000Z"})
  @Expose()
  @IsDate()
  issueDate: Date;             // Date the Bill of Lading was issued

  @ApiProperty({description: 'Consignor Details'})
  @Expose()
  @Type(() => PartyDetailsDto)
  consignor: PartyDetailsDto;

  @ApiProperty({description: 'Consignee Details'})
  @Expose()
  @Type(() => PartyDetailsDto)
  consignee: PartyDetailsDto;

  @ApiProperty({description: 'Carrier Details'})
  @Expose()
  @Type(() => PartyDetailsDto)
  carrier: PartyDetailsDto;

  @ApiProperty({description: "Shippers reference number", example: "REF12345"})
  @Expose()
  @IsString()
  shipperReference: string;

  @ApiProperty({description: "List of containers used in shipment"})
  @Expose()
  @Type(() => BolContainerDetails)
  containerInfo: BolContainerDetails[];  // List of containers used in shipment

  @ApiProperty({description: "Details of the Shipment"})
  @Expose()
  @Type(() => BolShipmentDetails)
  shipmentDetails: BolShipmentDetails;

  @ApiProperty({description: "Details of the charges"})
  @Expose()
  @Type(() => BolCharges)
  charges:BolCharges;

  @ApiProperty({description: "Details of related documents "})
  @Expose()
  @Type(() => BolDocuments)
  documents: BolDocuments;
}

// *****************************************************************************
// Warehouse Receipt Content DTO
// *****************************************************************************
export class GoodsDetails {
  @ApiProperty({description: "Description of the goods"})
  @Expose()
  @IsString()
  description: string;

  @ApiProperty({description: "Quantity of the goods received"})
  @Expose()
  @IsNumber()
  quantity: number;

  @ApiProperty({description: "Unit of the goods"})
  @Expose()
  @IsString()
  unit: string;

  @ApiProperty({description: "Weight per unit in kgs"})
  @Expose()
  @IsNumber()
  weightPerUnitKgs: number;

  @ApiProperty({description: "Total Weight for consignment in kgs"})
  @Expose()
  @IsNumber()
  totalWeightKgs: number;

  @ApiProperty({description: "Volume per unit in cubic metres"})
  @Expose()
  @IsNumber()
  volumePerUnitCubicMetres: number;

  @ApiProperty({description: "Total Volume in cubic metres"})
  @Expose()
  @IsNumber()
  totalVolumeCubicMetres: number;
}

export class StorageTerms {
  @ApiProperty({description: "Storage Fee Per Day"})
  @Expose()
  @IsNumber()
  storageFeePerDay: number;

  @ApiProperty({description: "Currency for Storage Fees"})
  @Expose()
  @IsString()
  currency: string;

  @ApiProperty({description: "Start date for storage"})
  @Expose()
  @IsDate()
  storageStartDate: Date;

  @ApiProperty({description: "End date for storage"})
  @Expose()
  @IsDate()
  storageEndDate: Date;

  @ApiProperty({description: "Storage Conditions"})
  @Expose()
  @IsString()
  specialConditions: string
}

export class DeliveryTerms {
  @ApiProperty({description: "Delivery Date"})
  @Expose()
  @IsDate()
  deliveryDate: Date;

  @ApiProperty({description: "Delivery Address"})
  @Expose()
  @IsString()
  deliveryAddress: string;

  @ApiProperty({description: "Delivery Contact"})
  @Expose()
  @IsString()
  deliveryContact: string;

  @ApiProperty({description: "Delivery Instructions"})
  @Expose()
  @IsString()
  deliveryInstructions: string;
}
export class ReceiptTerms {
  @ApiProperty({description: "Return Policy"})
  @Expose()
  @IsString()
  returnPolicy: string;

  @ApiProperty({description: "Warehouse Liability"})
  @Expose()
  @IsString()
  liability: string;
}

export class WarehouseReceiptDocuments {
  @ApiProperty({description: "Invoice Number related to this warehouse receipt"})
  @Expose()
  @IsString()
  invoiceNumber: string;

  @ApiProperty({description: "Packing List Number related to this warehouse receipt"})
  @Expose()
  @IsString()
  packingListNumber: string;

  @ApiProperty({description: "Insurance Certificate Number related to this warehouse receipt"})
  @Expose()
  @IsString()
  insuranceCertificateNumber: string;

  @ApiProperty({description: "Customs Declaration number related to this warehouse receipt"})
  @Expose()
  @IsString()
  customsDeclarationNumber: string
}

export class WarehouseReceiptContentDto {
  @ApiProperty({description: "Warehouse Receipt Number"})
  @Expose()
  @IsString()
  receiptNumber: string;

  @ApiProperty({description: "Date of Issue for this warehouse receipt"})
  @Expose()
  @IsDate()
  issueDate: Date;

  @ApiProperty({description: "Details of the Warehouse receiving the goods"})
  @Expose()
  @Type(() => PartyDetailsDto)
  warehouseDetails: PartyDetailsDto;

  @ApiProperty({description: "Consignor Details for the goods"})
  @Expose()
  @Type(() => PartyDetailsDto)
  consignorDetails: PartyDetailsDto;

  @ApiProperty({description: "Consignee Details for the goods"})
  @Expose()
  @Type(() => PartyDetailsDto)
  consigneeDetails: PartyDetailsDto;

  @ApiProperty({description: "Details of the goods received"})
  @Expose()
  @Type(() => GoodsDetails)
  goodsDetails: GoodsDetails;

  @ApiProperty({description: "Storage Terms for the goods received"})
  @Expose()
  @Type(() => StorageTerms)
  storageTerms: StorageTerms;

  @ApiProperty({description: "Delivery Terms for the goods received"})
  @Expose()
  @Type(() => DeliveryTerms)
  deliveryTerms: DeliveryTerms;

  @ApiProperty({description: "Receipt terms for the goods received"})
  @Expose()
  @Type(() => ReceiptTerms)
  receiptTerms: ReceiptTerms;

  @ApiProperty({description: "Documents related to the goods recieved"})
  @Expose()
  @Type(() => WarehouseReceiptDocuments)
  documents: WarehouseReceiptDocuments;
}


// *****************************************************************************
// Bill Of Exchange Content DTO
// *****************************************************************************
export class BillOfExchangeContentDto {
  @ApiProperty({ description: 'Bill of Exchange Reference' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  boeReference: string;

  @ApiProperty({ description: 'Amount in Numbers' })
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  @Type(() => DocumentAmountDto)
  amount: DocumentAmountDto;

  @ApiProperty({ description: 'Issue Date' })
  @Expose()
  @IsDate()
  @IsNotEmpty()
  issueDate: Date;

  @ApiProperty({ description: 'Due Date' })
  @Expose()
  @IsDate()
  @IsNotEmpty()
  dueDate: Date;

  @ApiProperty({ description: 'Place of Issue' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  placeOfIssue: string;

  @ApiProperty({ description: 'Drawee Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PartyDetailsDto)
  issuedBy: PartyDetailsDto;

  @ApiProperty({ description: 'Drawer Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PartyDetailsDto)
  payableTo: PartyDetailsDto;

  @ApiProperty({ description: 'Terms and Conditions' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  termsAndConditions: string;
}

export class PromissoryNoteContentDto {
  @ApiProperty({ description: 'Promissory Note Reference' })
  @Expose()
  @IsNotEmpty()
  @IsString()
  noteReference: string;

  @ApiProperty({ description: 'Date of Issue' })
  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @ApiProperty({ description: 'Date of Maturity' })
  @Expose()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  maturityDate: Date;

  @ApiProperty({ description: 'Lender Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PartyDetailsDto)
  lender: PartyDetailsDto;

  @ApiProperty({ description: 'Borrower Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PartyDetailsDto)
  borrower: PartyDetailsDto;

  @ApiProperty({ description: 'Loan Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PromissoryNoteLoanDetailsDto)
  loanDetails: PromissoryNoteLoanDetailsDto;

  @ApiProperty({ description: 'Terms and conditions' })
  @Expose()
  @IsString()
  @IsOptional()
  specialConditions?: string;
}

export class OtherDocumentContentDto {
  @ApiProperty({ description: 'Document Title' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Issue Date' })
  @Expose()
  @IsString()
  @IsOptional()
  issueDate?: string;

  @ApiProperty({ description: 'Expiry Date' })
  @Expose()
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ description: 'Description' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class TradeDocumentDto {
  @ApiProperty({ description: 'Document Id' })
  @IsString()
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Date the document was created' })
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date the document was last updated' })
  @IsDate()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ description: 'Account Id' })
  @Expose()
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Trade Document Reference' })
  @Expose()
  @IsString()
  documentReference: string;

  @ApiProperty({ description: 'Trade Document Type' })
  @IsEnum(TradeDocumentType)
  @IsNotEmpty()
  @Expose()
  documentType: TradeDocumentType;

  @ApiProperty({ description: 'Current Document Status' })
  @Expose()
  @IsEnum(TradeDocumentStatus)
  status: TradeDocumentStatus;

  @ApiProperty({ description: 'Document Content based on document type' })
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type((type) => {
    const obj = type?.object as TradeDocumentDto;
    return obj.documentType === TradeDocumentType.INVOICE ? InvoiceContentDto :
      obj.documentType === TradeDocumentType.PROMISSORY_NOTE ? PromissoryNoteContentDto :
        obj.documentType === TradeDocumentType.BILL_OF_EXCHANGE ? BillOfExchangeContentDto :
          obj.documentType === TradeDocumentType.WAREHOUSE_RECEIPT ? WarehouseReceiptContentDto :
          obj.documentType === TradeDocumentType.OTHER ? OtherDocumentContentDto : OtherDocumentContentDto
      ;
  })
  documentContent?: InvoiceContentDto | BillOfExchangeContentDto | PromissoryNoteContentDto | OtherDocumentContentDto;

  @ApiProperty({ description: 'Trade Document Claimants' })
  @Expose()
  @IsOptional()
  @Type(() => TradeDocumentClaimantsDto)
  claimants?: TradeDocumentClaimantsDto;

  @ApiProperty({ description: 'Issue Details for the document' })
  @Expose()
  @IsOptional()
  @Type(() => IssueDetailsDto)
  issueDetails: IssueDetailsDto;

  @ApiProperty({ description: 'Verifiable Document hash' })
  @Expose()
  @IsOptional()
  verifiableDocumentHash: string;

  @ApiProperty({description: 'Deal Identifier that this trade document is associated with'})
  @Expose()
  @IsOptional()
  @IsString()
  dealId: string;

  @ApiProperty({ description: 'Document Tracking ID' })
  @Expose()
  @IsOptional()
  documentTrackingId: string;

  @ApiProperty({ description: 'Original Trade Document File Details' })
  @Expose()
  @IsOptional()
  @Type(() => TradeDocumentFileDTO)
  originalFile?: TradeDocumentFileDTO;

  @ApiProperty({ description: 'Issued Trade Document File Details' })
  @Expose()
  @IsOptional()
  @Type(() => TradeDocumentFileDTO)
  issuedFile?: TradeDocumentFileDTO;

  @ApiProperty({ description: 'Trade Trust File Details' })
  @Expose()
  @IsOptional()
  @Type(() => TradeDocumentFileDTO)
  tradeTrustFile?: TradeDocumentFileDTO;

  @ApiProperty({description: 'Internal Document Signing ID referencing the Signing Event for multi-party document signing'})
  @Expose()
  @IsOptional()
  documentSigningId?: string
}

// *****************************************************************************
// Create/Update Trade Document DTO
// *****************************************************************************

export class CreateTradeDocumentFromFileDto {
  @ApiProperty({ description: 'Trade Document Reference' })
  @IsString()
  @IsNotEmpty()
  documentReference: string;

  @ApiProperty({ description: 'Trade Document Type' })
  @IsEnum(TradeDocumentType)
  @IsNotEmpty()
  documentType: TradeDocumentType;
}


export class UpsertTradeDocumentFileDto {
  @ApiProperty({
    description: 'Trade Document File',
    type: 'string',
    format: 'binary',
  })
  @Expose()
  file: Express.Multer.File;
}

export class DocumentTrackingDto {
  @Expose()
  @IsString()
  documentTrackingId: string;
}

export class UpsertTradeDocumentDto {
  @ApiProperty({ description: 'Trade Document Reference' })
  @Expose()
  @IsString()
  @IsOptional()
  documentReference?: string;

  @ApiProperty({ description: 'Trade Document Type' })
  @Expose()
  @IsEnum(TradeDocumentType)
  @IsOptional()
  documentType?: TradeDocumentType;

  @ApiProperty({ description: 'Document Content based on document type' })
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type((type) => {
    const obj = type?.object as UpsertTradeDocumentDto;
    return obj.documentType === TradeDocumentType.INVOICE ? InvoiceContentDto :
      obj.documentType === TradeDocumentType.PROMISSORY_NOTE ? PromissoryNoteContentDto :
        obj.documentType === TradeDocumentType.BILL_OF_EXCHANGE ? BillOfExchangeContentDto :
          obj.documentType === TradeDocumentType.BILL_OF_LADING ? BillOfLadingContentDto :
          obj.documentType === TradeDocumentType.OTHER ? OtherDocumentContentDto : OtherDocumentContentDto
      ;
  })
 documentContent?: InvoiceContentDto | BillOfExchangeContentDto | PromissoryNoteContentDto | OtherDocumentContentDto;

  @ApiProperty({ description: 'Trade Document Claimants' })
  @Expose()
  @IsOptional()
  claimants?: TradeDocumentClaimantsDto;
}

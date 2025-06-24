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
  currency: number;
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
  @ApiProperty({ description: 'Issue Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  issueDate: Date;

  @ApiProperty({ description: 'Maturity Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  matuirityDate: Date;

  @ApiProperty({ description: 'Promise Amount' })
  @Expose()
  @IsNumber()
  @Type(() => DocumentAmountDto)
  amount: DocumentAmountDto;

  @ApiProperty({ description: 'Issued By' })
  @Expose()
  @Type(() => PartyDetailsDto)
  issuedBy: PartyDetailsDto;

  @ApiProperty({ description: 'Payable To' })
  @Expose()
  @Type(() => PartyDetailsDto)
  payableTo: PartyDetailsDto;

  @ApiProperty({ description: 'Place of Payment' })
  @Expose()
  @IsString()
  @IsOptional()
  placeOfPayment: string;

  @ApiProperty({ description: 'Interest Rate for Loan' })
  @Expose()
  @IsNumber()
  interestRate: number;

  @ApiProperty({ description: 'Terms and conditions' })
  @Expose()
  @IsString()
  @IsOptional()
  termsAndConditions?: string;
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
  @Transform(({ value }) => value.toISOString(), { toPlainOnly: true })
  @Expose()
  createdAt: string;

  @ApiProperty({ description: 'Date the document was last updated' })
  @Transform(({ value }) => value.toISOString(), { toPlainOnly: true })
  @Expose()
  updatedAt: string;

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
  @IsString()
  status: string;

  @ApiProperty({ description: 'Document Content based on document type' })
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type((type) => {
    const obj = type?.object as TradeDocumentDto;
    return obj.documentType === TradeDocumentType.INVOICE ? InvoiceContentDto :
      obj.documentType === TradeDocumentType.PROMISSORY_NOTE ? PromissoryNoteContentDto :
        obj.documentType === TradeDocumentType.BILL_OF_EXCHANGE ? BillOfExchangeContentDto :
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
          obj.documentType === TradeDocumentType.OTHER ? OtherDocumentContentDto : OtherDocumentContentDto
      ;
  })
 documentContent?: InvoiceContentDto | BillOfExchangeContentDto | PromissoryNoteContentDto | OtherDocumentContentDto;

  @ApiProperty({ description: 'Trade Document Claimants' })
  @Expose()
  @IsOptional()
  claimants?: TradeDocumentClaimantsDto;
}

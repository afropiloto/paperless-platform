import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
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
  BillOfExchangeContent,
  BillOfExchangePartyDetails,
  InvoiceContent,
  InvoicePartyDetails,
  OtherDocumentContent,
  PromissoryNoteContent,
} from '../schema/document-content.schema';
import {
  LoanPeriodUnit,
  TradeDocumentType,
} from '../../types/trade-documents.types';
import { TradeTrustDocumentClass } from '../../trade-trust/trade-trust.types';
import { TradeDocumentFileDTO } from './trade-document-file.dto';

// *****************************************************************************
// Bill Of Exchange Content DTO
// *****************************************************************************
export class BillOfExchangePartyDetailsDto {
  @ApiProperty({ description: 'Party Signatory' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  signatory: string;

  @ApiProperty({ description: 'Name of Authorised Party Signatory' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  nameOfAuthorisedSignatory: string;
}

export class BillOfExchangeDetailsDto {
  @ApiProperty({ description: 'Bill of Exchange Reference' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  boeReference: string;

  @ApiProperty({ description: 'Amount for Bill of Exchange' })
  @Expose()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Currency Code' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Bill of Exchange Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  billOfExchangeDate: Date;

  @ApiProperty({ description: 'Place of Issue' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  placeOfIssue: string;

  @ApiProperty({ description: 'Date of Issue' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  dateOfIssue: string;

  @ApiProperty({ description: 'At Details' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  atDetails: string;

  @ApiProperty({ description: 'Payee Name' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  payToTheOrder: string;

  @ApiProperty({ description: 'Drawn Under' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  drawnUnder: string;

  @ApiProperty({ description: 'Issued By' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  issuedBy: string;

  @ApiProperty({ description: 'Drawee Details' })
  @Expose()
  @IsNotEmpty()
  drawee: BillOfExchangePartyDetails;

  @ApiProperty({ description: 'Drawer Details' })
  @Expose()
  @IsNotEmpty()
  drawer: BillOfExchangePartyDetails;

  @ApiProperty({ description: 'Terms and Conditions' })
  @Expose()
  @IsOptional()
  termsAndConditions?: string;
}

// *****************************************************************************
// Promissory Note DTO
// *****************************************************************************
export class PromissoryNotePartyDetailsDto {
  @ApiProperty({ description: 'Party Company Name' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'Address where company is located' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Country where company is located' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Signatory Name' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  signatoryName: string;

  @ApiProperty({ description: 'Date Signed by Party' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  dateSigned: string;
}

export class PromissoryNoteLoanDetailsDto {
  @ApiProperty({ description: 'Loan Amount' })
  @Expose()
  @IsNumber()
  loanAmount: number;

  @ApiProperty({ description: 'Currency Code for Loan Amount' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Period of Loan' })
  @Expose()
  @IsNumber()
  loanPeriod: string;

  @ApiProperty({ description: 'Loan Period Unit' })
  @Expose()
  @IsEnum(LoanPeriodUnit)
  loanPeriodUnit: LoanPeriodUnit;

  @ApiProperty({ description: 'Interest Rate for Loan' })
  @Expose()
  @IsNumber()
  interestRate: number;

  @ApiProperty({ description: 'Payment Schedule Details' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  paymentSchedule: string;

  @ApiProperty({ description: 'Loan Terms' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  loanTerms: string;
}

export class PromissoryNoteDetailsDto {
  @ApiProperty({ description: 'Lender Details' })
  @Expose()
  @IsNotEmpty()
  lender: PromissoryNotePartyDetailsDto;

  @ApiProperty({ description: 'Borrower Details' })
  @Expose()
  @IsNotEmpty()
  borrower: PromissoryNotePartyDetailsDto;

  @ApiProperty({ description: 'Loan Details' })
  @Expose()
  @IsNotEmpty()
  loanDetails: PromissoryNoteLoanDetailsDto;
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

export class InvoiceDetailsDto {
  @ApiProperty({ description: 'Invoice Number' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @ApiProperty({ description: 'Due Date' })
  @Expose()
  @IsDate()
  @Type(() => Date)
  dueDate: string;

  @ApiProperty({ description: 'Invoice Terms' })
  @Expose()
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiProperty({ description: 'Currency Code' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty({ description: 'Bill From Details' })
  @Expose()
  @IsNotEmpty()
  billFrom: InvoicePartyDetails;

  @ApiProperty({ description: 'Bill To Details' })
  @Expose()
  @IsNotEmpty()
  billTo: InvoicePartyDetails;

  @ApiProperty({ description: 'Billable Items' })
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillableItemDto)
  billableItems: BillableItemDto[];

  @ApiProperty({ description: 'Invoice Sub-Total' })
  @Expose()
  @IsNumber()
  subTotal: number;

  @ApiProperty({ description: 'Invoice Tax Amount' })
  @Expose()
  @IsNumber()
  tax: number;

  @ApiProperty({ description: 'Invoice Total' })
  @Expose()
  @IsNumber()
  total: number;
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
  holder: TradeDocumentClaimantDetailsDto;

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

// Create a class for document content transformation
export class DocumentContent {
  @Expose()
  @IsOptional()
  @Type(() => InvoiceDetailsDto)
  invoice?: InvoiceDetailsDto;

  @Expose()
  @IsOptional()
  @Type(() => BillOfExchangeDetailsDto)
  billOfExchange?: BillOfExchangeDetailsDto;

  @Expose()
  @IsOptional()
  @Type(() => PromissoryNoteDetailsDto)
  promissoryNote?: PromissoryNoteDetailsDto;

  @Expose()
  @IsOptional()
  @Type(() => OtherDocumentDetailsDto)
  other?: OtherDocumentDetailsDto;
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
  @IsString()
  @IsNotEmpty()
  invoiceDate: string;

  @ApiProperty({ description: 'Due Date' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  dueDate: string;

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

  @ApiProperty({ description: 'Sub Total' })
  @Expose()
  @IsNumber()
  subTotal: number;

  @ApiProperty({ description: 'Tax Amount' })
  @Expose()
  @IsNumber()
  tax: number;

  @ApiProperty({ description: 'Total Amount' })
  @Expose()
  @IsNumber()
  total: number;
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
  amountInNumbers: number;

  @ApiProperty({ description: 'Currency' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Bill of Lading Date' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  billOfLadingDate: string;

  @ApiProperty({ description: 'Place of Issue' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  placeOfIssue: string;

  @ApiProperty({ description: 'Date of Issue' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  dateOfIssue: string;

  @ApiProperty({ description: 'At Details' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  atDetails: string;

  @ApiProperty({ description: 'Pay To The Order' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  payToTheOrder: string;

  @ApiProperty({ description: 'Amount in Words' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  amountInWords: string;

  @ApiProperty({ description: 'Drawn Under' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  drawnUnder: string;

  @ApiProperty({ description: 'Dated' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  dated: string;

  @ApiProperty({ description: 'Issued By' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  issuedBy: string;

  @ApiProperty({ description: 'Drawee Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => BillOfExchangePartyDetailsDto)
  drawee: BillOfExchangePartyDetailsDto;

  @ApiProperty({ description: 'Drawer Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => BillOfExchangePartyDetailsDto)
  drawer: BillOfExchangePartyDetailsDto;

  @ApiProperty({ description: 'Terms and Conditions' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  termsAndConditions: string;
}

export class PromissoryNoteContentDto {
  @ApiProperty({ description: 'Lender Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PromissoryNotePartyDetailsDto)
  lender: PromissoryNotePartyDetailsDto;

  @ApiProperty({ description: 'Borrower Details' })
  @Expose()
  @IsNotEmpty()
  @Type(() => PromissoryNotePartyDetailsDto)
  borrower: PromissoryNotePartyDetailsDto;

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
  @Transform(({ obj }) => {
    if (!obj) return undefined;
    const contentField = obj.documentType?.toLowerCase() === 'invoice' ? 'invoiceContent' :
                        obj.documentType?.toLowerCase() === 'bill of exchange' ? 'billOfExchangeContent' :
                        obj.documentType?.toLowerCase() === 'promissory note' ? 'promissoryNoteContent' :
                        'otherDocumentContent';
    return obj[contentField];
  }, { toPlainOnly: true })
  documentContent?: InvoiceContentDto | BillOfExchangeContentDto | PromissoryNoteContentDto | OtherDocumentContentDto;

  @Exclude()
  invoiceContent?: InvoiceContent
  @Exclude()
  billOfExchangeContent?: BillOfExchangeContent;
  @Exclude()
  promissoryNoteContent?: PromissoryNoteContent
  @Exclude()
  otherDocumentContent?: OtherDocumentContent

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

  @ApiProperty({ description: 'Verifiable Data URL hash' })
  @Expose()
  @IsOptional()
  verifiableDataUrlHash: string;

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
  documentContent?: DocumentContent;

  @Exclude()
  invoiceContent?: InvoiceContent
  @Exclude()
  billOfExchangeContent?: BillOfExchangeContent;
  @Exclude()
  promissoryNoteContent?: PromissoryNoteContent
  @Exclude()
  otherDocumentContent?: OtherDocumentContent

  @ApiProperty({ description: 'Trade Document Claimants' })
  @Expose()
  @IsOptional()
  claimants?: TradeDocumentClaimantsDto;
}

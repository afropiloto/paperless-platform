import { Prop, Schema } from '@nestjs/mongoose';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TradeDocumentFileStatus } from '../trade-documents/trade-document-file.types';

export enum TradeDocumentStatus {
  IN_PROGRESS="In Progress",
  READY_TO_ISSUE="Ready to Issue",
  ISSUED="Issued",
  PROCESSING="Processing",
}
export enum TradeDocumentType {
  INVOICE = 'invoice',
  BILL_OF_EXCHANGE = 'bill of exchange',
  PROMISSORY_NOTE = 'promissory note',
  OTHER = 'other'
}

export enum LoanPeriodUnit {
  HOUR = 'hours',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export interface TradeDocumentFileDetails {
  storedFileName: string,
  storedFilePath: string,
  mimeType: string,
  originalFileName: string,
  size: number,
  status: TradeDocumentFileStatus
}

// *****************************************************************************
// Bill of Exchange Document Content
// *****************************************************************************
export interface BillOfExchangePartyDetails {
  signatory: string;
  nameOfAuthorisedSignatory: string;
}

export interface BillOfExchangeContent {
  boeReference: string;
  amountInNumbers: number;
  currency: string;
  billOfLadingDate: string;
  placeOfIssue: string;
  dateOfIssue: string;
  atDetails: string;
  payToTheOrder: string;
  amountInWords: string;
  drawnUnder: string;
  dated: string;
  issuedBy: string;
  drawee: BillOfExchangePartyDetails;
  drawer: BillOfExchangePartyDetails;
  termsAndConditions: string;
}
// *****************************************************************************
// Promissory Note Document Content
// *****************************************************************************
export interface PromissoryNotePartyDetails {
  companyName: string;
  address: string;
  country: string;
  signatoryName: string;
  dateSigned: string;
}

export interface PromissoryNoteLoanDetails {
  loanAmount: number;
  currency: string;
  loanPeriod: string;
  loanPeriodUnit: LoanPeriodUnit;
  interestRate: number;
  paymentSchedule: string;
  loanTerms: string;
}

export interface PromissoryNoteContent {
  lender: PromissoryNotePartyDetails
  borrower: PromissoryNotePartyDetails
  loanDetails:  PromissoryNoteLoanDetails;
}

// *****************************************************************************
// Invoice Trade Document Content Schema
// *****************************************************************************
export interface InvoicePartyDetails {
  companyName: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  contactNumber: string;
  contactEmail: string;
}

export interface BillableItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceContent  {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  currencyCode: string;
  billFrom: InvoicePartyDetails;
  billTo: InvoicePartyDetails;
  billableItems: BillableItem[];
  subTotal: number;
  tax: number;
  total: number;
}

// *****************************************************************************
// Other Trade Document Content Schema
// *****************************************************************************
export interface OtherDocumentContent {
  title: string;
  issueDate: string;
  expiryDate: string;
  description: string;
}


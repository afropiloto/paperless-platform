import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LoanPeriodUnit } from '../../types/trade-documents.types';


// *****************************************************************************
// Bill of Exchange Document Content Schema
// *****************************************************************************
@Schema({ _id: false, timestamps: false })
export class BillOfExchangePartyDetails {
  @Prop({ required: true })
  signatory: string;

  @Prop({ required: true })
  nameOfAuthorisedSignatory: string;
}
@Schema({ _id: false, timestamps: false })
export class BillOfExchangeContent {
  @Prop({ required: true })
  boeReference: string;

  @Prop({ required: true })
  amountInNumbers: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  billOfLadingDate: string;

  @Prop({ required: true })
  placeOfIssue: string;

  @Prop({ required: true })
  dateOfIssue: string;

  @Prop({ required: true })
  atDetails: string;

  @Prop({ required: true })
  payToTheOrder: string;

  @Prop({ required: true })
  amountInWords: string;

  @Prop({ required: true })
  drawnUnder: string;

  @Prop({ required: true })
  dated: string;

  @Prop({ required: true })
  issuedBy: string;

  @Prop({ required: true })
  drawee: BillOfExchangePartyDetails;

  @Prop({ required: true })
  drawer: BillOfExchangePartyDetails;

  @Prop({ required: true })
  termsAndConditions: string;
}


// *****************************************************************************
// Promissory Note Document Content Schema
// *****************************************************************************
@Schema ({_id: false, timestamps: false})
export class PromissoryNotePartyDetails {
  @Prop({ required: true })
  companyName: string;
  @Prop({ required: true })
  address: string;
  @Prop({ required: true })
  country: string;
  @Prop({ required: true })
  signatoryName: string;
  @Prop({ required: true })
  dateSigned: string;
}

@Schema({_id: false, timestamps: false})
export class PromissoryNoteLoanDetails {
  @Prop({ required: true })
  loanAmount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  loanPeriod: string;

  @Prop({enum: LoanPeriodUnit, required: true })
  loanPeriodUnit: LoanPeriodUnit;

  @Prop({ required: true })
  interestRate: number;

  @Prop({ required: true })
  paymentSchedule: string;

  @Prop({ required: true })
  loanTerms: string;
}

@Schema({_id: false, timestamps: false})
export class PromissoryNoteContent {
  @Prop({ type: PromissoryNotePartyDetails, required: true })
  lender: PromissoryNotePartyDetails

  @Prop({ type: PromissoryNotePartyDetails, required: true })
  borrower: PromissoryNotePartyDetails

  @Prop({ type: PromissoryNoteLoanDetails, required: true })
  loanDetails:  PromissoryNoteLoanDetails;

}

// *****************************************************************************
// Invoice Trade Document Content Schema
// *****************************************************************************
@Schema({_id: false, timestamps: false})
export class InvoicePartyDetails {

  @Prop({ required: true })
  companyName: string;
  @Prop({ required: true })
  streetAddress: string;
  @Prop({ required: false })
  city: string;
  @Prop({ required: false })
  postalCode: string;
  @Prop({ required: false })
  contactNumber: string;
  @Prop({ required: false})
  contactEmail: string;
}

@Schema({_id: false, timestamps:false})
export class BillableItem {
  @Prop({ required: true })
  description: string;
  @Prop({ required: true })
  quantity: number;
  @Prop({ required: true })
  unitPrice: number;
  @Prop({ required: true })
  amount: number;
}

@Schema({_id: false, timestamps: false})
export class InvoiceContent  {
  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ required: true })
  invoiceDate: string;

  @Prop({ required: true })
  dueDate: string;

  @Prop()
  terms: string;

  @Prop({ required: true })
  currencyCode: string;

  @Prop({type: InvoicePartyDetails, required: true })
  billFrom: InvoicePartyDetails;

  @Prop({ type: InvoicePartyDetails, required: true })
  billTo: InvoicePartyDetails;

  @Prop({ type: [BillableItem], default: [] })
  billableItems: BillableItem[];

  @Prop({ required: true })
  subTotal: number;

  @Prop({ required: true })
  tax: number;

  @Prop({ required: true })
  total: number;
}


// *****************************************************************************
// Other Trade Document Content Schema
// *****************************************************************************
@Schema( {_id: false, timestamps: false})
export class OtherDocumentContent {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  issueDate: string;

  @Prop({ required: false })
  expiryDate: string;

  @Prop({ required: true })
  description: string;
}

export const OtherDocumentDetailsSchema =
  SchemaFactory.createForClass(OtherDocumentContent);
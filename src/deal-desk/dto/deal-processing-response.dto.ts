import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DealProcessingStatus, FundingDecisionType } from '../types/deal-desk.types';
import { IsDate, IsEnum } from 'class-validator';
import { Logger } from '@nestjs/common';

export enum PromissoryNoteState {
  IN_PROGRESS="IN_PROGRESS",
  ISSUED="ISSUED",
  SIGNED="SIGNED"
}

@Exclude()
export class PromissoryNotePartyDto {
  @ApiProperty({ description: 'Name of the party' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Address of the party' })
  @Expose()
  address: string;

  @ApiProperty({ description: 'Registration number of the party' })
  @Expose()
  registrationNumber: string;
}

@Exclude()
export class SignatureDto {
  @ApiProperty({ description: 'Name of the signatory' })
  @Expose()
  signedBy: string;

  @ApiProperty({ description: 'When the signature was made' })
  @Expose()
  signedAt: string;
}

@Exclude()
export class SignaturesDto {
  @ApiProperty({ type: SignatureDto, required: false })
  @Expose()
  lender?: SignatureDto;

  @ApiProperty({ type: SignatureDto, required: false })
  @Expose()
  borrower?: SignatureDto;
}

@Exclude()
export class DealPromissoryNoteDto {
  @ApiProperty({ description: 'Unique identifier of the promissory note' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Reference to the deal' })
  @Expose()
  dealId: string;

  @ApiProperty({ type: PromissoryNotePartyDto })
  @Expose()
  @Type(() => PromissoryNotePartyDto)
  borrower: PromissoryNotePartyDto;

  @ApiProperty({ type: PromissoryNotePartyDto })
  @Expose()
  @Type(() => PromissoryNotePartyDto)
  lender: PromissoryNotePartyDto;

  @ApiProperty({ description: 'Loan amount' })
  @Expose()
  amount: number;

  @ApiProperty({ description: 'Currency of the loan' })
  @Expose()
  currency: string;

  @ApiProperty({ description: 'Date when the note was issued' })
  @Expose()
  @Type(() => Date)
  issueDate: Date;

  @ApiProperty({ description: 'Date when the note matures' })
  @Expose()
  @Type(() => Date)
  maturityDate: Date;

  @ApiProperty({ description: 'Interest rate of the loan' })
  @Expose()
  interestRate: number;

  @ApiProperty({ description: 'Payment terms of the loan' })
  @Expose()
  paymentTerms: string;

  @ApiProperty({ description: 'Special conditions of the loan' })
  @Expose()
  specialConditions: string;

  @ApiProperty({ description: 'When the note was created' })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'When the note was last updated' })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty({ type: SignaturesDto, required: false })
  @Expose()
  @Type(() => SignaturesDto)
  signatures?: SignaturesDto;
}

@Exclude()
export class DealPromissoryNoteDetailsDto {
  private static readonly logger = new Logger(DealPromissoryNoteDetailsDto.name);

  @ApiProperty({description: "Content for the promissory note"})
  @Expose()
  @Type(() => DealPromissoryNoteDto)
  content: DealPromissoryNoteDto;

  @ApiProperty({description: "Status of the promissory note"})
  @Expose()
  @IsEnum(PromissoryNoteState)
  status: PromissoryNoteState

  @ApiProperty({description: "Date the Promissory note was created"})
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({description: "Date the Promissory note was last updated"})
  @Expose()
  @IsDate()
  updatedAt: Date;
}


@Exclude()
export class NoteResponseDto {
  @ApiProperty({
    description: 'The note text',
    example: 'Documentation verified and approved'
  })
  @Expose()
  note: string;

  @ApiProperty({
    description: 'ID of the user who added the note',
    example: 'user123'
  })
  @Expose()
  user: string;

  @ApiProperty({description: "Promissory Note Details for an approved deal"})
  @Expose()
  @Type(() => DealPromissoryNoteDetailsDto)
  promissoryNote?: DealPromissoryNoteDetailsDto;

  @ApiProperty({
    description: 'When the note was created',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  createdAt: Date;
}

@Exclude()
export class CheckListItemResponseDto {
  @ApiProperty({
    description: 'Title of the checklist item',
    example: 'Verify company registration'
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Current status of the checklist item',
    enum: ['Not Started', 'In Progress', 'Adverse', 'Satisfactory'],
    example: 'Satisfactory'
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Notes added to this checklist item',
    type: [NoteResponseDto]
  })
  @Expose()
  @Type(() => NoteResponseDto)
  notes: NoteResponseDto[];
}

@Exclude()
export class SectionResponseDto {
  @ApiProperty({
    description: 'Title of the section',
    example: 'Company Verification'
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Checklist items in this section',
    type: [CheckListItemResponseDto]
  })
  @Expose()
  @Type(() => CheckListItemResponseDto)
  items: CheckListItemResponseDto[];
}

@Exclude()
export class FundingDecisionResponseDto {
  @ApiProperty({
    description: 'The funding decision',
    enum: ['Awaiting Decision', 'Approved', 'Rejected'],
    example: 'Approved'
  })
  @Expose()
  decision: FundingDecisionType;

  @ApiProperty({
    description: 'Notes about the funding decision',
    type: NoteResponseDto
  })
  @Expose()
  @Type(() => NoteResponseDto)
  decisionNotes: NoteResponseDto;

  @ApiProperty({
    description: 'Decision Date',
    type: Date
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;
}


@Exclude()
export class DealProcessingResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the deal processing record',
    example: '507f1f77bcf86cd799439011'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  _id: string;

  @ApiProperty({
    description: 'Reference to the trade finance deal',
    example: '507f1f77bcf86cd799439012'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  dealId: string;

  @ApiProperty({
    description: 'Account ID associated with the deal processing',
    example: 'account123'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  accountId: string;

  @ApiProperty({
    description: 'Current status of the deal processing',
    enum: ['New', 'In Progress', 'Awaiting Decision', 'Approved', 'Rejected'],
    example: 'In Progress'
  })
  @Expose()
  status: DealProcessingStatus;

  @ApiProperty({
    description: 'Due diligence checklist sections',
    type: [SectionResponseDto]
  })

  @ApiProperty({description: "The version of the Due Diligence Checklist used for this deal", example:1})
  @Expose()
  dueDiligenceChecklistVersion: number;

  @Expose()
  @Type(() => SectionResponseDto)
  dueDiligenceChecks: SectionResponseDto[];

  @ApiProperty({
    description: 'Funding decision information',
    type: FundingDecisionResponseDto
  })
  @Expose()
  @Type(() => FundingDecisionResponseDto)
  fundingDecision: FundingDecisionResponseDto;

  @ApiProperty({
    description: 'Deal Promissory Note',
    type: DealPromissoryNoteDetailsDto
  })
  @Expose()
  @Type(() => DealPromissoryNoteDetailsDto)
  promissoryNote?: DealPromissoryNoteDetailsDto;


  @ApiProperty({
    description: 'When the record was created',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the record was last updated',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  updatedAt: Date;



  @ApiProperty({
    description: 'Name of the account associated with the deal',
    example: 'Account Name'
  })
  @Expose()
  accountName: string;

  @ApiProperty({
    description: 'Total invoice amount for the deal',
    example: 100000
  })
  @Expose()
  invoiceTotal: number;

  @ApiProperty({
    description: 'Requested loan amount for the deal',
    example: 50000
  })
  @Expose()
  loanAmount: number;

  @ApiProperty({
    description: 'Collateral amount for the deal',
    example: 20000
  })
  @Expose()
  collateralAmount: number;

  @ApiProperty({
    description: 'Term of the loan in days',
    example: 180
  })
  @Expose()
  loanTerm: number;
}

@Exclude()
export class DealProcessingSummaryResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the deal processing record',
    example: '507f1f77bcf86cd799439011'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  _id: string;

  @ApiProperty({
    description: 'Reference to the trade finance deal',
    example: '507f1f77bcf86cd799439012'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  dealId: string;

  @ApiProperty({
    description: 'Current status of the deal processing',
    enum: ['New', 'In Progress', 'Awaiting Decision', 'Approved', 'Rejected'],
    example: 'In Progress'
  })
  @Expose()
  status: DealProcessingStatus;

  @ApiProperty({
    description: 'When the record was created',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the record was last updated',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Account ID associated with the deal processing',
    example: 'account123'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  accountId: string;

  @ApiProperty({
    description: 'Name of the account associated with the deal',
    example: 'Account Name'
  })
  @Expose()
  accountName: string;

  @ApiProperty({
    description: 'Total invoice amount for the deal',
    example: 100000
  })
  @Expose()
  invoiceTotal: number;

  @ApiProperty({
    description: 'Requested loan amount for the deal',
    example: 50000
  })
  @Expose()
  loanAmount: number;

  @ApiProperty({
    description: 'Collateral amount for the deal',
    example: 20000
  })
  @Expose()
  collateralAmount: number;

  @ApiProperty({
    description: 'Term of the loan in days',
    example: 180
  })
  @Expose()
  loanTerm: number;

  @ApiProperty({
    description: 'Funding decision',
    enum: ['Awaiting Decision', 'Approved', 'Rejected'],
    example: 'Approved'
  })
  @Expose()
  fundingDecision: FundingDecisionType;
} 
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DealProcessingStatus, FundingDecisionType } from '../types/deal-desk.types';

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
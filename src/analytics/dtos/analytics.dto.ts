import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TradeDocumentStatus, TradeDocumentType } from '../../types/trade-documents.types';
import { TradeFinanceDealStatus } from '../../trade-finance/types/trade-finance.types';

export class RecentTradeDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  @Expose()
  @Transform(({ value }) => value.toString())
  id: string;

  @ApiProperty({ description: 'Document Reference' })
  @Expose()
  @IsString()
  documentReference: string;

  @ApiProperty({ description: 'Document Status', enum: TradeDocumentStatus })
  @Expose()
  @IsEnum(TradeDocumentStatus)
  status: TradeDocumentStatus;

  @ApiProperty({ description: 'Document Type', enum: TradeDocumentType })
  @Expose()
  @IsEnum(TradeDocumentType)
  documentType: TradeDocumentType;

  @ApiProperty({ description: 'Date Created' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Date Last Updated' })
  @Expose()
  @IsDate()
  updatedAt: Date;
}

export class RecentTradeFinanceDealDto {
  @ApiProperty({ description: 'Deal ID' })
  @Expose()
  @Transform(({ value }) => value.toString())
  id: string;

  @ApiProperty({ description: 'Deal Reference' })
  @Expose()
  @IsString()
  dealReference: string;

  @ApiProperty({ description: 'Deal Status', enum: TradeFinanceDealStatus })
  @Expose()
  @IsEnum(TradeFinanceDealStatus)
  dealStatus: TradeFinanceDealStatus;

  @ApiProperty({ description: 'Total Value' })
  @Expose()
  @IsNumber()
  totalValue: number;

  @ApiProperty({ description: 'Date Created' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Date Last Updated' })
  @Expose()
  @IsDate()
  updatedAt: Date;
}

export class TradeDocumentsSummaryDto {
  @ApiProperty({ description: 'Count of documents in progress', default: 0 })
  @Expose()
  @IsNumber()
  inProgress: number = 0;

  @ApiProperty({ description: 'Count of documents ready to issue', default: 0 })
  @Expose()
  @IsNumber()
  readyToIssue: number = 0;

  @ApiProperty({ description: 'Count of issued documents', default: 0 })
  @Expose()
  @IsNumber()
  issued: number = 0;

  @ApiProperty({ description: 'Count of signed documents', default: 0 })
  @Expose()
  @IsNumber()
  signed: number = 0;

  @ApiProperty({ description: 'Count of processing documents', default: 0 })
  @Expose()
  @IsNumber()
  processing: number = 0;

  @ApiProperty({ description: 'Total count of documents', default: 0 })
  @Expose()
  @IsNumber()
  total: number = 0;
}

export class TradeFinanceSummaryDto {
  @ApiProperty({ description: 'Count of deals in progress', default: 0 })
  @Expose()
  @IsNumber()
  inProgress: number = 0;

  @ApiProperty({ description: 'Count of deals with funding requested', default: 0 })
  @Expose()
  @IsNumber()
  fundingRequested: number = 0;

  @ApiProperty({ description: 'Count of deals with funding approved', default: 0 })
  @Expose()
  @IsNumber()
  fundingApproved: number = 0;

  @ApiProperty({ description: 'Count of deals with funding rejected', default: 0 })
  @Expose()
  @IsNumber()
  fundingRejected: number = 0;

  @ApiProperty({ description: 'Total count of deals', default: 0 })
  @Expose()
  @IsNumber()
  total: number = 0;
}

export class LimitQueryDto {
  @ApiProperty({ description: 'Maximum number of items to retrieve', required: false, example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}

export class SinceQueryDto {
  @ApiProperty({ description: 'Date to start summary from (ISO string)', example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  since: string;
} 
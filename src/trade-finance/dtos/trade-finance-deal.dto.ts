import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TradeFinanceDealStatus } from '../types/trade-finance.types';

@Exclude()
export class LoanDetailsDto {
  @ApiProperty({
    description: 'The currency of the loan',
    example: 'USD',
  })
  @Expose()
  currency: string;

  @ApiProperty({
    description: 'The amount of the loan',
    example: 100000,
  })
  @Expose()
  loanAmount: number;

  @ApiProperty({
    description: 'The duration of the loan in days',
    example: 90,
  })
  @Expose()
  loanDurationDays: number;

  @ApiProperty({
    description: 'The amount of collateral for the loan',
    example: 120000,
  })
  @Expose()
  loanCollateralAmount: number;
}

@Exclude()
export class TradeFinanceDealDto {
  @ApiProperty({
    description: 'Unique identifier of the trade finance deal',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  @Transform(({ value }) => value.toString())
  id: string;

  @ApiProperty({
    description: 'Unique reference for the trade finance deal',
    example: 'TF-2024-001',
  })
  @Expose()
  dealReference: string;

  @ApiProperty({
    description: 'The ID of the account that owns the deal',
    example: 'acc-123',
  })
  @Expose()
  accountId: string;

  @ApiProperty({
    description: 'Details of the loan',
    type: LoanDetailsDto,
  })
  @Expose()
  @Type(() => LoanDetailsDto)
  loanDetails: LoanDetailsDto;

  @ApiProperty({
    description: 'Array of document IDs associated with the deal',
    type: [String],
    example: ['doc-123', 'doc-456'],
  })
  @Expose()
  documentsIds: string[];

  @ApiProperty({
    description: 'Total value of the trade finance deal',
    example: 100000,
  })
  @Expose()
  totalValue: number;

  @ApiProperty({
    description: 'Current status of the trade finance deal',
    enum: Object.values(TradeFinanceDealStatus),
    example: TradeFinanceDealStatus.IN_PROGRESS,
  })
  @Expose()
  dealStatus: TradeFinanceDealStatus;

  @ApiProperty({
    description: 'The date when the deal was created',
    example: '2024-03-20T10:00:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the deal was last updated',
    example: '2024-03-20T10:00:00Z',
  })
  @Expose()
  updatedAt: Date;
} 
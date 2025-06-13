import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { TradeFinanceDealDto } from './trade-finance-deal.dto';

@Exclude()
export class TradeFinanceSearchMetadata {
  @ApiProperty({ description: 'Total number of matched records' })
  @Expose()
  totalDocuments: number;

  @ApiProperty({ description: 'Search results page number' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Total number of pages' })
  @Expose()
  totalPages: number;

  @ApiProperty({ description: 'Number of items per page' })
  @Expose()
  limit: number;
}

@Exclude()
export class TradeFinanceSearchResultsDto {
  @ApiProperty({ description: 'Search results metadata' })
  @Expose()
  @Type(() => TradeFinanceSearchMetadata)
  metadata: TradeFinanceSearchMetadata;

  @ApiProperty({ description: 'List of trade finance deals', type: [TradeFinanceDealDto] })
  @Expose()
  @Type(() => TradeFinanceDealDto)
  data: TradeFinanceDealDto[];
} 
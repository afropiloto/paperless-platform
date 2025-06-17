import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DealAnalyticsDto {
  @ApiProperty({
    description: 'Total number of new deals',
    example: 5
  })
  @Expose()
  totalNewDeals: number;

  @ApiProperty({
    description: 'Total number of in-progress deals',
    example: 8
  })
  @Expose()
  totalInProgressDeals: number;

  @ApiProperty({
    description: 'Total number of deals awaiting agreement',
    example: 2
  })
  @Expose()
  totalAwaitingAgreementDeals: number;
} 
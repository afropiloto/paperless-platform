import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDealProcessingDto {
  @ApiProperty({
    description: 'The ID of the deal to process',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  dealId: string;

  @ApiProperty({
    description: 'The ID of the account associated with this deal',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty()
  @IsMongoId()
  accountId: string;
} 
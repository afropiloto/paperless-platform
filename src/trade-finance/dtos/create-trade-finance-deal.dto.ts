import { IsArray, IsNotEmpty, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDetailsDto {
  @ApiProperty({
    description: 'The currency of the loan',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'The amount of the loan',
    example: 100000,
  })
  @IsNumber()
  @IsNotEmpty()
  loanAmount: number;

  @ApiProperty({
    description: 'The duration of the loan in days',
    example: 90,
  })
  @IsNumber()
  @IsNotEmpty()
  loanDurationDays: number;

  @ApiProperty({
    description: 'The amount of collateral for the loan',
    example: 120000,
  })
  @IsNumber()
  @IsNotEmpty()
  loanCollateralAmount: number;
}

export class CreateTradeFinanceDealDto {
  @ApiProperty({
    description: 'Unique reference for the trade finance deal',
    example: 'TF-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  dealReference: string;

  @ApiProperty({
    description: 'Details of the loan',
    type: CreateLoanDetailsDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateLoanDetailsDto)
  loanDetails: CreateLoanDetailsDto;

  @ApiProperty({
    description: 'Array of document IDs associated with the deal',
    type: [String],
    example: ['doc-123', 'doc-456'],
  })
  @IsArray()
  @IsString({ each: true })
  documentsIds: string[];

  @ApiProperty({
    description: 'Total value of the trade finance deal',
    example: 100000,
  })
  @IsNumber()
  @IsNotEmpty()
  totalValue: number;
} 
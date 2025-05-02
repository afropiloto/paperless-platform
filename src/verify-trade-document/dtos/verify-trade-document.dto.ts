import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class VerifyTradeDocumentFileDto {
  @ApiProperty({description: "Trade Document File", type: 'string', format: 'binary'})
  @Expose()
  file: Express.Multer.File;
}

export class TradeDocumentVerificationResultsDto {
  @ApiProperty({description: "Trade Document Verification Results"})
  @Expose()
  validationSuccess: boolean;

  @ApiProperty({description: "Trade Document Verification Results"})
  @Expose()
  documentIssued?:boolean;

  @ApiProperty({description: "Trade Document Verification Results"})
  @Expose()
  documentHashMatches?: boolean;

  @ApiProperty({description: "Trade Document Issue Date"})
  @Expose()
  @IsDate()
  @Type(() => Date)
  issueDate?: Date;

  @ApiProperty({description: "Trade Document Issuer"})
  @Expose()
  issuedBy?: string;

  @ApiProperty({description: "Verification Error Message"})
  @Expose()
  errorMessage?: string;

}
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Expose, Transform} from 'class-transformer';
import { TradeDocumentType } from '../../types/trade-documents.types';


export class TradeDocumentSummaryDto {
  @ApiProperty({description:"Internal Document Id"})
  @IsString()
  @Transform(({ value }) => value.toString(), { toPlainOnly: true })
  @Expose({ name: '_id' })
  id: string;

  @ApiProperty({description: "Date the document was created"})
  @Transform(() => Date)
  @Expose()
  createdAt: Date;

  @ApiProperty({description: "Date the document was last updated"})
  @Transform(() => Date)
  @Expose()
  updatedAt: Date;

  @ApiProperty({description: "Account Id"})
  @Expose()
  @IsString()
  accountId: string;

  @ApiProperty({description: "Trade Document Reference"})
  @Expose()
  @IsString()
  documentReference: string;

  @ApiProperty({description: "Trade Document Type"})
  @Expose()
  @IsEnum(TradeDocumentType)
  documentType: TradeDocumentType;

  @ApiProperty({description: "Current Document Status"})
  @Expose()
  @IsString()
  status: string;


}

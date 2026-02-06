import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { TradeDocumentFileStatus } from '../trade-document-file.types';

export class TradeDocumentFileDTO {
  @IsString()
  storedFileName: string;

  @IsString()
  storedFilePath: string;

  @ApiProperty({description: "Mime Type for the file"})
  @Expose()
  @IsString()
  mimeType: string;

  @ApiProperty({description: "Original file name"})
  @Expose()
  @IsString()
  originalFileName: string;

  @ApiProperty({description: "Original file size"})
  @Expose()
  @IsString()
  size: number;

  @ApiProperty({ description: 'Status of File', enum: Object.values(TradeDocumentFileStatus) })
  @Expose()
  @IsEnum(TradeDocumentFileStatus)
  status: TradeDocumentFileStatus;

  @ApiProperty({description: "Date the file was last updated"})
  @Expose()
  @IsOptional()
  @Type(() => Date)
  updatedAt?: Date;
}
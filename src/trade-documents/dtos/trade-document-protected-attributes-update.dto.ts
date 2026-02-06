import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TradeDocumentStatus } from '../../types/trade-documents.types';

export class TradeDocumentProtectedAttributesUpdateDto {
  @IsString()
  @IsOptional()
  documentTrackingId?: string;

  @IsString()
  @IsOptional()
  verifiableDocumentHash?: string;

  @ApiPropertyOptional({ description: 'Document status', enum: Object.values(TradeDocumentStatus) })
  @IsOptional()
  @IsEnum(TradeDocumentStatus)
  status?: TradeDocumentStatus;

  @IsString()
  @IsOptional()
  documentSigningId?: string;


}
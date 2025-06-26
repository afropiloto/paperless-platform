import { IsOptional, IsString } from 'class-validator';
import { TradeDocumentStatus } from '../../types/trade-documents.types';


export class TradeDocumentProtectedAttributesUpdateDto {
  @IsString()
  @IsOptional()
  documentTrackingId?: string;

  @IsString()
  @IsOptional()
  verifiableDocumentHash?: string

  @IsString()
  @IsOptional()
  status?: TradeDocumentStatus;

  @IsString()
  @IsOptional()
  documentSigningId?: string;


}
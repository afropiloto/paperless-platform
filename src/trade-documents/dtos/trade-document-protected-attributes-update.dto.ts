import { IsString } from 'class-validator';
import { TradeDocumentStatus } from '../../types/trade-documents.types';


export class TradeDocumentProtectedAttributesUpdateDto {
  @IsString()
  documentTrackingId: string;

  @IsString()
  verifiableDocumentHash: string

  @IsString()
  status: TradeDocumentStatus;

}
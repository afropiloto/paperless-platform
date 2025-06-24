import { AuditEventType } from '../audit-event-type.enum';
import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateAuditEventDto {
  @IsEnum(AuditEventType)
  eventType: AuditEventType;

  @IsString()
  accountId: string;

  @IsOptional()
  @IsString()
  documentId?: string;

  @IsString()
  @IsOptional()
  originator?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
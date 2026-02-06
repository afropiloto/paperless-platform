import { ApiProperty } from '@nestjs/swagger';
import { AuditEventType, AuditSubject } from '../audit-event-type.enum';
import { IsEnum, IsString, IsOptional, IsObject, IsDate } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateAuditEventDto {
  @ApiProperty({ description: 'Audit subject type', enum: Object.values(AuditSubject) })
  @IsEnum(AuditSubject)
  subject: AuditSubject;

  @ApiProperty({ description: 'Audit event type', enum: Object.values(AuditEventType) })
  @IsEnum(AuditEventType)
  eventType: AuditEventType;

  @IsString()
  identifier: string;

  @IsString()
  @IsOptional()
  accountId?: string

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
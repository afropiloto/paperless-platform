import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AuditEventType, AuditSubject } from '../audit-event-type.enum';


export class AuditEventFilterDto {
  @ApiProperty({ description: 'Audit subject type', enum: Object.values(AuditSubject) })
  @IsEnum(AuditSubject)
  subject: AuditSubject;

  @ApiProperty({ description: 'Resource identifier' })
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Account ID filter', required: false })
  @IsString()
  @IsOptional()
  accountId?: string;
}

export class AuditEventDto {
  @Expose()
  id: string;

  @ApiProperty({ description: 'Audit subject type', enum: Object.values(AuditSubject) })
  @Expose()
  @IsEnum(AuditSubject)
  subject: AuditSubject;

  @ApiProperty({ description: 'Audit event type', enum: Object.values(AuditEventType) })
  @Expose()
  @IsEnum(AuditEventType)
  eventType: AuditEventType;

  @Expose()
  @IsString()
  identifier: string;

  @Expose()
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  @Expose()
  originator?: string;

  @IsString()
  @IsOptional()
  @Expose()
  userId?: string;

  @IsDate()
  @Expose()
  createdAt: Date;

  @IsDate()
  @Expose()
  updatedAt: Date;

  @IsOptional()
  @IsObject()
  @Expose()
  details?: Record<string, any>;

}
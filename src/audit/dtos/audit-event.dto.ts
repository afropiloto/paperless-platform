import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { AuditEventType, AuditSubject } from '../audit-event-type.enum';


export class AuditEventFilterDto {
  @IsEnum(AuditSubject)
  subject: AuditSubject;

  @IsString()
  identifier: string;

  @IsString()
  @IsOptional()
  accountId?: string;
}

export class AuditEventDto {
  @Expose()
  id: string;

  @Expose()
  @IsEnum(AuditSubject)
  subject: AuditSubject;

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
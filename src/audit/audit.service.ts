import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import {
  CreateAuditEventDto,
} from './dtos/create-audit-event.dto';
import { AuditContextService } from './audit-context.service';
import { AuditEventDto, AuditEventFilterDto } from './dtos/audit-event.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditContext: AuditContextService,
    private readonly auditRepo: AuditRepository) {}

  async log(auditEvent: CreateAuditEventDto): Promise<void> {
    auditEvent.originator = this.auditContext.context.clientLabel;
    auditEvent.userId = this.auditContext.context.userId;
    await this.auditRepo.create(auditEvent);
  }

  async getResourceAuditEventsBySubject(auditFiler: AuditEventFilterDto): Promise<AuditEventDto[]> {
    return await this.auditRepo.findBy(auditFiler);
  }


}
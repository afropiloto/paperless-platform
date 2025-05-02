import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import {
  CreateAuditEventDto
} from './dtos/create-audit-event.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepo: AuditRepository) {}

  async log(auditEvent: CreateAuditEventDto): Promise<void> {
    await this.auditRepo.create(auditEvent);
  }


}
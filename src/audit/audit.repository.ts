
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEvent } from './schemas/audit-event.schema';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(AuditEvent.name)
    private readonly auditModel: Model<AuditEvent>,
  ) {}

  async create(event: Partial<AuditEvent>): Promise<AuditEvent> {
    return this.auditModel.create(event);
  }
}
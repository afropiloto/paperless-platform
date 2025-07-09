
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditEvent } from './schemas/audit-event.schema';
import { plainToInstance } from 'class-transformer';
import { AuditEventDto, AuditEventFilterDto } from './dtos/audit-event.dto';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(AuditEvent.name)
    private readonly auditModel: Model<AuditEvent>,
  ) {}

  async create(event: Partial<AuditEvent>): Promise<AuditEvent> {
    return this.auditModel.create(event);
  }

  async findBy(filter: AuditEventFilterDto): Promise<AuditEventDto[]> {

    const results = await this.auditModel.find(filter).exec();

    return plainToInstance(AuditEventDto, results.map(result => {return {id: result._id.toString(), ...result.toObject()}}))

  }
}
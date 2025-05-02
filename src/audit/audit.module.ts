import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditEvent, AuditEventSchema } from './schemas/audit-event.schema';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditEvent.name, schema: AuditEventSchema }]),
  ],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}

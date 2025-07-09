import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditEvent, AuditEventSchema } from './schemas/audit-event.schema';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { AuditContextService } from './audit-context.service';
import { AuditController } from './audit.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditEvent.name, schema: AuditEventSchema }]),
  ],
  providers: [AuditService, AuditRepository, AuditContextService],
  exports: [AuditService, AuditContextService],
  controllers: [AuditController],
})
export class AuditModule {}

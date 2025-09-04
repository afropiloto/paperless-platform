import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigModule } from '../jwt/jwt-config.module';
import { AuditEvent, AuditEventSchema } from './schemas/audit-event.schema';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { AuditContextService } from './audit-context.service';
import { AuditController } from './audit.controller';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditEvent.name, schema: AuditEventSchema }]),
    JwtConfigModule,
    ApiKeyAuthModule
  ],
  providers: [AuditService, AuditRepository, AuditContextService],
  exports: [AuditService, AuditContextService],
  controllers: [AuditController],
})
export class AuditModule {}

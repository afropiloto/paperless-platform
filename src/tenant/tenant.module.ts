import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [ApiKeyAuthModule],
  controllers: [TenantController],
  providers: []
})
export class TenantModule {}

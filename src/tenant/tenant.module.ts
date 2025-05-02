import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';

@Module({
  controllers: [TenantController],
  providers: []
})
export class TenantModule {}

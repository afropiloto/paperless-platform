import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DealDeskQueues } from '../constants/app.constants';
import { AuditModule } from '../audit/audit.module';
import { DealDeskModule } from '../deal-desk/deal-desk.module';
import { FundingRequestProcessor } from './funding-request.processor';

@Module({
  imports: [
    BullModule.registerQueue({name: DealDeskQueues.CUSTOMER_FUNDING_REQUESTS}),
    AuditModule,
    DealDeskModule
  ],
  providers: [FundingRequestProcessor]
})
export class DealDeskEventsModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DvpSettlementQueues } from '../constants/app.constants';
import { MletrDvpModule } from '../mletr-dvp/mletr-dvp.module';
import { AuditModule } from '../audit/audit.module';
import { DvpSettlementProcessor } from './dvp-settlement.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: DvpSettlementQueues.SETTLEMENT_QUEUE }),
    MletrDvpModule,
    AuditModule,
  ],
  providers: [DvpSettlementProcessor],
})
export class MletrDvpEventsModule {}

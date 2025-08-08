import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EMAIL_QUEUE } from '../constants/app.constants';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [
    EmailQueueService,
  ],
  exports: [
    EmailQueueService,
    BullModule, // Export BullModule so other modules can register processors
  ],
})
export class EmailEventsModule {}

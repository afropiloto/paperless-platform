import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AttentionIndexController } from './attention-index.controller';
import { AttentionIndexService } from './attention-index.service';
import {
  AttentionConstituent,
  AttentionConstituentSchema,
  AttentionIndexEvent,
  AttentionIndexEventSchema,
  AttentionMetricsReading,
  AttentionMetricsReadingSchema,
  AttentionSnapshot,
  AttentionSnapshotSchema,
} from './schemas/attention-index.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: AttentionConstituent.name, schema: AttentionConstituentSchema },
      { name: AttentionSnapshot.name, schema: AttentionSnapshotSchema },
      { name: AttentionIndexEvent.name, schema: AttentionIndexEventSchema },
      { name: AttentionMetricsReading.name, schema: AttentionMetricsReadingSchema },
    ]),
  ],
  controllers: [AttentionIndexController],
  providers: [AttentionIndexService],
  exports: [AttentionIndexService],
})
export class AttentionIndexModule {}

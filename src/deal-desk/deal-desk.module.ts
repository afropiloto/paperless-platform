import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DealDeskController } from './deal-desk.controller';
import { DealDeskService } from './deal-desk.service';
import { DealDeskRepository } from './deal-desk.repository';
import { DueDiligenceChecklist, DueDiligenceChecklistSchema } from './schemas/due-diligence-checklist.schema';
import { DueDiligenceChecklistRepository } from './repositories/due-diligence-checklist.repository';
import { DueDiligenceChecklistService } from './services/due-diligence-checklist.service';
import { DueDiligenceChecklistController } from './controllers/due-diligence-checklist.controller';
import { DealProcessing, DealProcessingSchema } from './schemas/deal-processing.schema';
import { DealProcessingRepository } from './repositories/deal-processing.repository';
import { DealProcessingService } from './services/deal-processing.service';
import { DealProcessingController } from './controllers/deal-processing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DueDiligenceChecklist.name, schema: DueDiligenceChecklistSchema },
      { name: DealProcessing.name, schema: DealProcessingSchema }
    ])
  ],
  controllers: [
    DealDeskController,
    DueDiligenceChecklistController,
    DealProcessingController
  ],
  providers: [
    DealDeskService,
    DealDeskRepository,
    DueDiligenceChecklistRepository,
    DueDiligenceChecklistService,
    DealProcessingRepository,
    DealProcessingService
  ]
})
export class DealDeskModule {}

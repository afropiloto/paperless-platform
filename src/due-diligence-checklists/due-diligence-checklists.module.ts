import { Module } from '@nestjs/common';
import { DueDiligenceChecklistsController } from './due-diligence-checklists.controller';
import { DueDiligenceChecklistsService } from './due-diligence-checklists.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DueDiligenceChecklistInstance,
  DueDiligenceChecklistInstanceSchema,
} from './schemas/due-diligence-checklist-instance.schema';
import { DueDiligenceChecklistInstanceRepository } from './due-diligence-checklist-instance.repository';
import { DueDiligenceChecklistRepository } from './due-diligence-checklists.repository';
import { DueDiligenceChecklist, DueDiligenceChecklistSchema } from './schemas/due-diligence-checklist.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: DueDiligenceChecklistInstance.name, schema: DueDiligenceChecklistInstanceSchema },
      { name: DueDiligenceChecklist.name, schema: DueDiligenceChecklistSchema}
    ]),
  ],
  controllers: [DueDiligenceChecklistsController],
  providers: [DueDiligenceChecklistsService, DueDiligenceChecklistInstanceRepository, DueDiligenceChecklistRepository],
  exports:[DueDiligenceChecklistsService, DueDiligenceChecklistInstanceRepository, DueDiligenceChecklistRepository]
})
export class DueDiligenceChecklistsModule {}

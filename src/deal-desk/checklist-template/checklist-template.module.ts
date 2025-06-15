import { Module } from '@nestjs/common';
import { ChecklistTemplateRepository } from './checklist-template.repository';
import { ChecklistTemplateService } from './checklist-template.service';
import { ChecklistTemplateController } from './checklist-template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChecklistTemplate]),
  ],
  providers: [
    ChecklistTemplateRepository,
    ChecklistTemplateService
  ],
  controllers: [ChecklistTemplateController],
  exports: [
    ChecklistTemplateService
  ]
})
export class ChecklistTemplateModule {}

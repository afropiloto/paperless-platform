import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { ChecklistTemplateResponseDto } from './dto/checklist-template-response.dto';
import { plainToInstance } from 'class-transformer';
import { ChecklistTemplate, SectionTemplate, ChecklistItemTemplate } from './entities/checklist-template.entity';
import { ChecklistTemplateRepository } from './checklist-template.repository';

@Injectable()
export class ChecklistTemplateService {
  private readonly logger = new Logger(ChecklistTemplateService.name);

  constructor(
    private readonly checklistTemplateRepository: ChecklistTemplateRepository,
  ) {}

  async createTemplateVersion(createDto: CreateChecklistTemplateDto): Promise<ChecklistTemplateResponseDto> {
    try {
      // Get the latest version to increment
      const latestTemplate = await this.checklistTemplateRepository.getLatestTemplateVersion();
      const newVersion = latestTemplate ? latestTemplate.version + 1 : 1;

      this.logger.debug('Creating new template:', { newVersion });
      // Create new template with incremented version
      const newTemplate: Partial<ChecklistTemplate> = {
        name: createDto.name,
        description: createDto.description,
        version: newVersion,
        isActive: true,
        sections: createDto.sections.map((section, index) => {
          const sectionTemplate = new SectionTemplate();
          sectionTemplate.title = section.title;
          sectionTemplate.guidance = section.guidance;
          sectionTemplate.position = index + 1;
          sectionTemplate.checklistTemplate = newTemplate as ChecklistTemplate;
          sectionTemplate.items = section.items.map((item, qIndex) => {
            const itemTemplate = new ChecklistItemTemplate();
            itemTemplate.title = item.title;
            itemTemplate.guidance = item.guidance;
            itemTemplate.position = qIndex + 1;
            itemTemplate.sectionTemplate = sectionTemplate;
            return itemTemplate;
          });
          return sectionTemplate;
        })
      };

      this.logger.debug('Creating new template:', { newTemplate });
      const savedTemplate = await this.checklistTemplateRepository.createTemplateVersion(newTemplate);
      return plainToInstance(ChecklistTemplateResponseDto, savedTemplate, { 
        excludeExtraneousValues: true 
      });
    } catch (error) {
      this.logger.error(`Failed to create template version: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLatestTemplateVersion(): Promise<ChecklistTemplateResponseDto> {
    try {
      const template = await this.checklistTemplateRepository.getLatestTemplateVersion();

      if (!template) {
        throw new NotFoundException('No active template found');
      }

      return plainToInstance(ChecklistTemplateResponseDto, template, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get latest template version: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTemplateByVersion(version: number): Promise<ChecklistTemplateResponseDto> {
    try {
      const template = await this.checklistTemplateRepository.getTemplateByVersion(version);

      if (!template) {
        throw new NotFoundException(`Template with version ${version} not found`);
      }

      return plainToInstance(ChecklistTemplateResponseDto, template, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get template by version: ${error.message}`, error.stack);
      throw error;
    }
  }
}

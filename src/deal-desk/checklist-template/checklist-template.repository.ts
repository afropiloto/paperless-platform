import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';

@Injectable()
export class ChecklistTemplateRepository {
  private readonly logger = new Logger(ChecklistTemplateRepository.name);

  constructor(@InjectRepository(ChecklistTemplate)
              private readonly repository: Repository<ChecklistTemplate>
  ) {}

  async createTemplateVersion(template: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> {
    try {
      const newTemplate = this.repository.create(template);
      const savedTemplate = await this.repository.save(newTemplate);
      return this.repository.findOne({
        where: { id: savedTemplate.id },
        relations: ['sections', 'sections.items']
      });
    } catch (error) {
      this.logger.error(`Failed to create template version: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLatestTemplateVersion(): Promise<ChecklistTemplate | null> {
    try {
      return await this.repository.findOne({
        where: { isActive: true },
        order: { version: 'DESC' },
        relations: ['sections', 'sections.items']
      });
    } catch (error) {
      this.logger.error(`Failed to get latest template version: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTemplateByVersion(version: number): Promise<ChecklistTemplate | null> {
    try {
      return await this.repository.findOne({
        where: { version, isActive: true },
        relations: ['sections', 'sections.items']
      });
    } catch (error) {
      this.logger.error(`Failed to get template by version: ${error.message}`, error.stack);
      throw error;
    }
  }
}
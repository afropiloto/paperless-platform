import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DueDiligenceChecklistRepository } from '../repositories/due-diligence-checklist.repository';
import { CreateChecklistDto } from '../dto/create-checklist.dto';
import { ChecklistResponseDto } from '../dto/checklist-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class DueDiligenceChecklistService {
  private readonly logger = new Logger(DueDiligenceChecklistService.name);

  constructor(
    private readonly checklistRepository: DueDiligenceChecklistRepository,
  ) {}

  async createChecklist(createDto: CreateChecklistDto): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.checklistRepository.create(createDto);
      return plainToInstance(ChecklistResponseDto, checklist, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to create checklist: ${error.message}`);
      throw error;
    }
  }

  async getLatestChecklist(): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.checklistRepository.getLatest();
      if (!checklist) {
        throw new NotFoundException('No checklist found');
      }
      return plainToInstance(ChecklistResponseDto, checklist, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get latest checklist: ${error.message}`);
      throw error;
    }
  }

  async getChecklistByVersion(version: number): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.checklistRepository.getByVersion(version);
      if (!checklist) {
        throw new NotFoundException(`Checklist with version ${version} not found`);
      }
      return plainToInstance(ChecklistResponseDto, checklist, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get checklist by version ${version}: ${error.message}`);
      throw error;
    }
  }

  async getAllChecklists(): Promise<ChecklistResponseDto[]> {
    try {
      const checklists = await this.checklistRepository.getAll();
      return plainToInstance(ChecklistResponseDto, checklists, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get all checklists: ${error.message}`);
      throw error;
    }
  }
} 
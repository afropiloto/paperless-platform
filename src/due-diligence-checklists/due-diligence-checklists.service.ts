import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateChecklistDto } from './dtos/create-checklist.dto';
import { DueDiligenceChecklistType } from './types/due-diligence-checklists.types';
import { DueDiligenceChecklistRepository } from './due-diligence-checklists.repository';
import { plainToInstance } from 'class-transformer';
import { ChecklistResponseDto } from './dtos/checklist-response.dto';
import { ChecklistItemStatus } from '../deal-desk/types/deal-desk.types';
import { ChecklistItemUpdateDto } from './dtos/update-checklist.dto';
import { DueDiligenceChecklistInstanceRepository } from './due-diligence-checklist-instance.repository';
import { ChecklistInstanceDto } from './dtos/checklist-instance.dto';

@Injectable()
export class DueDiligenceChecklistsService {
  private readonly logger = new Logger(DueDiligenceChecklistsService.name);

  constructor(
    private readonly checklistRepository:DueDiligenceChecklistRepository,
    private readonly checklistInstanceRepository: DueDiligenceChecklistInstanceRepository
  ) {}


  async createChecklist(checklistType: DueDiligenceChecklistType, createDto: CreateChecklistDto): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.checklistRepository.create(checklistType, createDto);
      return plainToInstance(ChecklistResponseDto, checklist, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to create checklist: ${error.message}`);
      throw error;
    }
  }

  async getChecklistByVersion(checklistType: DueDiligenceChecklistType, version: number): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.checklistRepository.getByVersion(checklistType, version);
      if (!checklist) {
        throw new NotFoundException(`Checklist with version ${version} not found`);
      }
      return plainToInstance(ChecklistResponseDto, checklist, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get checklist by version ${version}: ${error.message}`);
      throw error;
    }
  }

  async getAllChecklists(checklistType: DueDiligenceChecklistType): Promise<ChecklistResponseDto[]> {
    try {
      const checklists = await this.checklistRepository.getAll(checklistType);
      return plainToInstance(ChecklistResponseDto, checklists, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get all checklists: ${error.message}`);
      throw error;
    }
  }

  async getLatestChecklist(checklistType: DueDiligenceChecklistType): Promise<ChecklistResponseDto> {
    try {
      const checklist = await this.checklistRepository.getLatest(checklistType);
      if (!checklist) {
        throw new NotFoundException('No checklist found');
      }
      return plainToInstance(ChecklistResponseDto, checklist, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(`Failed to get latest checklist: ${error.message}`);
      throw error;
    };
  }

  /*
  Creates a new Checklist instance based on the type
   */
  async createChecklistInstance(checklistType: DueDiligenceChecklistType): Promise<ChecklistInstanceDto> {

    const latestChecklist =
      await this.checklistRepository.getLatest(checklistType);

    if (!latestChecklist) {
      throw new NotFoundException('No due diligence checklist found');
    }

    // Construct the checklist object
    const checklistInstance = {
      checklistType: checklistType,
      version: latestChecklist.version,
      sections: latestChecklist.sections.map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          title: item.title,
          status: ChecklistItemStatus.NOT_STARTED,
          notes: [],
        })),
      }))
    }
    return await this.checklistInstanceRepository.create(checklistInstance);


  }

  async updateChecklistInstance(checklistId: string, updates: ChecklistItemUpdateDto[]) {
    this.logger.debug({checklistId, updates})
    try {
      const currentChecklist = await this.checklistInstanceRepository.findById(checklistId);

      for (const update of updates) {
        // Find the section and item indices
        const sectionIndex = currentChecklist.sections.findIndex(
          (section) => section.title === update.sectionTitle,
        );
        if (sectionIndex === -1) {
          throw new NotFoundException(
            `Section with title "${update.sectionTitle}" not found`,
          );
        }

        const itemIndex = currentChecklist.sections[
          sectionIndex
          ].items.findIndex((item) => item.title === update.itemTitle);
        if (itemIndex === -1) {
          throw new NotFoundException(
            `Item with title "${update.itemTitle}" not found in section "${update.sectionTitle}"`,
          );
        }

        // Update status if provided
        if (update.status) {
          await this.checklistInstanceRepository.updateChecklistItemStatus(
            checklistId,
            sectionIndex,
            itemIndex,
            update.status,
          );
        }

        // Add note if provided
        if (update.notes && update.notes.length > 0) {
          for (const note of update.notes) {
            await this.checklistInstanceRepository.addNote(
              checklistId,
              sectionIndex,
              itemIndex,
              note.text,
              note.userId,
            );
          }
        }
      }

      return await this.checklistInstanceRepository.findById(checklistId)

    }
    catch (error) {
      this.logger.error(`Failed to update checklist instance with id "${checklistId}". Error: ${error.message}`);
    }
  }

  async getChecklistInstance(checklistId: string) {
    return this.checklistInstanceRepository.findById(checklistId);

  }
}
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DueDiligenceChecklistInstance } from './schemas/due-diligence-checklist-instance.schema';
import { ChecklistItemStatus } from './types/due-diligence-checklists.types';
import { plainToInstance } from 'class-transformer';
import { ChecklistInstanceDto } from './dtos/checklist-instance.dto';

export class DueDiligenceChecklistInstanceRepository {
  private readonly logger = new Logger(DueDiligenceChecklistInstanceRepository.name);

  constructor(
    @InjectModel(DueDiligenceChecklistInstance.name)
    private readonly dueDiligenceChecklistInstanceModel: Model<DueDiligenceChecklistInstance>,
  ) {}


  async findById(checklistId: string) {
    try {
      const checklistInstance =  await this.dueDiligenceChecklistInstanceModel
        .findOne({_id: checklistId})
        .exec();

      if (!checklistInstance) { throw new NotFoundException("Checklist instance not found"); }

      return plainToInstance(ChecklistInstanceDto, checklistInstance.toObject());

    } catch (error) {
      this.logger.error(`Failed to get due diligence checklist instance (${checklistId}): ${error.message}`);
      throw error;
    }
  }

  async addNote(checklistId: string, sectionIndex: number, itemIndex: number, note: string, user: string="") {
    try {
      const checklistInstance = await this.findById(checklistId);

      // Validate section and item indices
      if (!checklistInstance.sections[sectionIndex]) {
        throw new NotFoundException(
          `Section at index ${sectionIndex} not found`,
        );
      }
      if (!checklistInstance.sections[sectionIndex].items[itemIndex]) {
        throw new NotFoundException(
          `Item at index ${itemIndex} not found in section ${sectionIndex}`,
        );
      }

      // Add new note
      const newNote = {
        note,
        user,
        createdAt: new Date(),
      };

    // Use $push to add to the notes array
      return await this.dueDiligenceChecklistInstanceModel
        .findByIdAndUpdate(
          checklistId,
          {
            $push: {
              [`sections.${sectionIndex}.items.${itemIndex}.notes`]:
              newNote,
            },
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to add note to deal processing ${checklistId}: ${error.message}`,
      );
      throw error;
    }
  }

  async updateChecklistItemStatus(checklistId: string, sectionIndex: number, itemIndex: number, status: ChecklistItemStatus) {
    try {
      const checklistInstance = await this.findById(checklistId);

      // Validate section and item indices
      if (!checklistInstance.sections[sectionIndex]) {
        throw new NotFoundException(
          `Section at index ${sectionIndex} not found`,
        );
      }
      if (!checklistInstance.sections[sectionIndex].items[itemIndex]) {
        throw new NotFoundException(
          `Item at index ${itemIndex} not found in section ${sectionIndex}`,
        );
      }

      // Update the status
      const updatedChecklist = await this.dueDiligenceChecklistInstanceModel
        .findByIdAndUpdate(
          checklistId,
          {
            $set: {
              [`sections.${sectionIndex}.items.${itemIndex}.status`]:
              status,
            },
          },
          { new: true },
        )
        .exec();

      return updatedChecklist
    } catch (error) {
      this.logger.error(
        `Failed to update checklist item status for deal processing ${checklistId}: ${error.message}`,
      );
      throw error;
    }
  }

  async create(checklistInstance: Partial<ChecklistInstanceDto>) {
    try {
      const createdChecklist = new this.dueDiligenceChecklistInstanceModel(checklistInstance);
      const newInstance =  await createdChecklist.save();

      return plainToInstance(ChecklistInstanceDto, newInstance.toObject());
    } catch (error) {
      this.logger.error(`Failed to create due diligence checklist: ${error.message}`);
      throw error;
    }
  }
}



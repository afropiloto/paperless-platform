import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DealProcessing } from '../schemas/deal-processing.schema';
import { CheckListItemStatus } from '../schemas/deal-processing.schema';
import { FundingDecisionType } from '../schemas/deal-processing.schema';

@Injectable()
export class DealProcessingRepository {
  private readonly logger = new Logger(DealProcessingRepository.name);

  constructor(
    @InjectModel(DealProcessing.name)
    private readonly dealProcessingModel: Model<DealProcessing>,
  ) {}

  async create(dealProcessing: DealProcessing): Promise<DealProcessing> {
    try {
      const createdDealProcessing = new this.dealProcessingModel(dealProcessing);
      return await createdDealProcessing.save();
    } catch (error) {
      this.logger.error(`Failed to create deal processing: ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<DealProcessing> {
    try {
      const dealProcessing = await this.dealProcessingModel.findById(id).exec();
      if (!dealProcessing) {
        throw new NotFoundException(`Deal processing with id ${id} not found`);
      }
      return dealProcessing;
    } catch (error) {
      this.logger.error(`Failed to find deal processing by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<DealProcessing[]> {
    try {
      return await this.dealProcessingModel
        .find()
        .select('_id dealId status createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to find all deal processing records: ${error.message}`);
      throw error;
    }
  }

  async addNote(
    id: string,
    sectionIndex: number,
    itemIndex: number,
    note: string,
    user: string,
  ): Promise<DealProcessing> {
    try {
      const dealProcessing = await this.findById(id);
      
      // Validate section and item indices
      if (!dealProcessing.dueDiligenceChecks[sectionIndex]) {
        throw new NotFoundException(`Section at index ${sectionIndex} not found`);
      }
      if (!dealProcessing.dueDiligenceChecks[sectionIndex].items[itemIndex]) {
        throw new NotFoundException(`Item at index ${itemIndex} not found in section ${sectionIndex}`);
      }

      // Add new note
      const newNote = {
        note,
        user,
        createdAt: new Date(),
      };

      // Use $push to add to the notes array
      return await this.dealProcessingModel.findByIdAndUpdate(
        id,
        {
          $push: {
            [`dueDiligenceChecks.${sectionIndex}.items.${itemIndex}.notes`]: newNote,
          },
        },
        { new: true },
      ).exec();
    } catch (error) {
      this.logger.error(`Failed to add note to deal processing ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateChecklistItemStatus(
    id: string,
    sectionIndex: number,
    itemIndex: number,
    status: CheckListItemStatus,
  ): Promise<DealProcessing> {
    try {
      const dealProcessing = await this.findById(id);
      
      // Validate section and item indices
      if (!dealProcessing.dueDiligenceChecks[sectionIndex]) {
        throw new NotFoundException(`Section at index ${sectionIndex} not found`);
      }
      if (!dealProcessing.dueDiligenceChecks[sectionIndex].items[itemIndex]) {
        throw new NotFoundException(`Item at index ${itemIndex} not found in section ${sectionIndex}`);
      }

      // Update the status
      return await this.dealProcessingModel.findByIdAndUpdate(
        id,
        {
          $set: {
            [`dueDiligenceChecks.${sectionIndex}.items.${itemIndex}.status`]: status,
          },
        },
        { new: true },
      ).exec();
    } catch (error) {
      this.logger.error(`Failed to update checklist item status for deal processing ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateFundingDecision(
    id: string,
    decision: FundingDecisionType,
    note: string,
    user: string,
  ): Promise<DealProcessing> {
    try {
      const dealProcessing = await this.findById(id);

      const fundingDecision = {
        decision,
        decisionNotes: {
          note,
          user,
          createdAt: new Date(),
        },
      };

      return await this.dealProcessingModel.findByIdAndUpdate(
        id,
        {
          $set: {
            fundingDecision,
            status: decision === FundingDecisionType.APPROVED 
              ? 'Approved' 
              : decision === FundingDecisionType.REJECTED 
                ? 'Rejected' 
                : 'Awaiting Decision',
          },
        },
        { new: true },
      ).exec();
    } catch (error) {
      this.logger.error(`Failed to update funding decision for deal processing ${id}: ${error.message}`);
      throw error;
    }
  }
} 
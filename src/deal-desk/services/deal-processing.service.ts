import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DealProcessingRepository } from '../repositories/deal-processing.repository';
import { DealProcessing, DealProcessingStatus, CheckListItemStatus } from '../schemas/deal-processing.schema';
import { FundingDecisionType } from '../schemas/deal-processing.schema';
import { ChecklistItemUpdateDto } from '../dto/update-checklist.dto';
import { DueDiligenceChecklistService } from './due-diligence-checklist.service';
import { CreateDealProcessingDto } from '../dto/create-deal-processing.dto';
import { Types } from 'mongoose';
import { DueDiligenceChecklistRepository } from '../repositories/due-diligence-checklist.repository';

@Injectable()
export class DealProcessingService {
  private readonly logger = new Logger(DealProcessingService.name);

  constructor(
    private readonly dealProcessingRepository: DealProcessingRepository,
    private readonly dueDiligenceChecklistRepository: DueDiligenceChecklistRepository,
  ) {}

  async createDealProcessing(
    createDto: CreateDealProcessingDto,
  ): Promise<DealProcessing> {
    // Get the latest due diligence checklist
    const latestChecklist = await this.dueDiligenceChecklistRepository.getLatest();
    if (!latestChecklist) {
      throw new NotFoundException('No due diligence checklist found');
    }

    // Create a new deal processing record with the checklist details
    const dealProcessing = new DealProcessing();
    dealProcessing.dealId = new Types.ObjectId(createDto.dealId);
    dealProcessing.accountId = new Types.ObjectId(createDto.accountId);
    dealProcessing.status = DealProcessingStatus.NEW;
    dealProcessing.sections = latestChecklist.sections.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      items: section.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        order: item.order,
        status: ChecklistItemStatus.NOT_STARTED,
        notes: [],
      })),
    }));
    dealProcessing.fundingDecision = FundingDecisionType.PENDING;

    return await this.dealProcessingRepository.create(dealProcessing);
  }

  async getDealProcessing(id: string): Promise<DealProcessing> {
    try {
      return await this.dealProcessingRepository.findById(id);
    } catch (error) {
      this.logger.error(`Failed to get deal processing ${id}: ${error.message}`);
      throw error;
    }
  }

  async getDealProcessingList(): Promise<DealProcessing[]> {
    try {
      return await this.dealProcessingRepository.findAll();
    } catch (error) {
      this.logger.error('Failed to get deal processing list:', error.message);
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
      return await this.dealProcessingRepository.updateFundingDecision(
        id,
        decision,
        note,
        user,
      );
    } catch (error) {
      this.logger.error(`Failed to update funding decision for deal ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateChecklist(
    id: string,
    updates: ChecklistItemUpdateDto[],
  ): Promise<DealProcessing> {
    try {
      const dealProcessing = await this.dealProcessingRepository.findById(id);
      let updatedDealProcessing = dealProcessing;

      for (const update of updates) {
        // Find the section and item indices
        const sectionIndex = dealProcessing.dueDiligenceChecks.findIndex(
          section => section.title === update.sectionTitle,
        );
        if (sectionIndex === -1) {
          throw new NotFoundException(
            `Section with title "${update.sectionTitle}" not found`,
          );
        }

        const itemIndex = dealProcessing.dueDiligenceChecks[sectionIndex].items.findIndex(
          item => item.title === update.itemTitle,
        );
        if (itemIndex === -1) {
          throw new NotFoundException(
            `Item with title "${update.itemTitle}" not found in section "${update.sectionTitle}"`,
          );
        }

        // Update status if provided
        if (update.status) {
          updatedDealProcessing = await this.dealProcessingRepository.updateChecklistItemStatus(
            id,
            sectionIndex,
            itemIndex,
            update.status,
          );
        }

        // Add note if provided
        if (update.note) {
          updatedDealProcessing = await this.dealProcessingRepository.addNote(
            id,
            sectionIndex,
            itemIndex,
            update.note.text,
            update.note.userId,
          );
        }
      }

      return updatedDealProcessing;
    } catch (error) {
      this.logger.error(`Failed to update checklist for deal ${id}: ${error.message}`);
      throw error;
    }
  }
} 
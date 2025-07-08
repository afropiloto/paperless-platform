import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DueDiligenceChecklist } from './schemas/due-diligence-checklist.schema';
import { DueDiligenceChecklistType } from './types/due-diligence-checklists.types';
import { CreateChecklistDto } from './dtos/create-checklist.dto';

@Injectable()
export class DueDiligenceChecklistRepository {
  private readonly logger = new Logger(DueDiligenceChecklistRepository.name);

  constructor(
    @InjectModel(DueDiligenceChecklist.name)
    private readonly dueDiligenceChecklistModel: Model<DueDiligenceChecklist>,
  ) {}

  async create(checklistType: DueDiligenceChecklistType, createDto: CreateChecklistDto): Promise<DueDiligenceChecklist> {
    try {
      const latestOfType = await this.getLatest(checklistType);
      let version: number;
      if (!latestOfType) {
        version = 1
      } else {
        version = latestOfType.version + 1
      }

      const createdChecklist = new this.dueDiligenceChecklistModel({version: version, checklistType: checklistType, ...createDto});
      return await createdChecklist.save();
    } catch (error) {
      this.logger.error(`Failed to create due diligence checklist: ${error.message}`);
      throw error;
    }
  }

  async getLatest(checklistType: DueDiligenceChecklistType): Promise<DueDiligenceChecklist> {
    try {
      return await this.dueDiligenceChecklistModel
        .findOne({checklistType})
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get latest due diligence checklist: ${error.message}`);
      throw error;
    }
  }

  async getByVersion(checklistType: DueDiligenceChecklistType, version: number): Promise<DueDiligenceChecklist> {
    try {
      return await this.dueDiligenceChecklistModel
        .findOne({ checklistType, version })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get due diligence checklist by version ${version}: ${error.message}`);
      throw error;
    }
  }

  async getAll(checklistType: DueDiligenceChecklistType): Promise<DueDiligenceChecklist[]> {
    try {
      return await this.dueDiligenceChecklistModel
        .find({checklistType})
        .sort({ version: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get all due diligence checklists: ${error.message}`);
      throw error;
    }
  }
}
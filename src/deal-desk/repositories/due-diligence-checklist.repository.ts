import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DueDiligenceChecklist } from '../schemas/due-diligence-checklist.schema';

@Injectable()
export class DueDiligenceChecklistRepository {
  private readonly logger = new Logger(DueDiligenceChecklistRepository.name);

  constructor(
    @InjectModel(DueDiligenceChecklist.name)
    private readonly dueDiligenceChecklistModel: Model<DueDiligenceChecklist>,
  ) {}

  async create(checklist: Partial<DueDiligenceChecklist>): Promise<DueDiligenceChecklist> {
    try {
      const createdChecklist = new this.dueDiligenceChecklistModel(checklist);
      return await createdChecklist.save();
    } catch (error) {
      this.logger.error(`Failed to create due diligence checklist: ${error.message}`);
      throw error;
    }
  }

  async getLatest(): Promise<DueDiligenceChecklist> {
    try {
      return await this.dueDiligenceChecklistModel
        .findOne()
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get latest due diligence checklist: ${error.message}`);
      throw error;
    }
  }

  async getByVersion(version: number): Promise<DueDiligenceChecklist> {
    try {
      return await this.dueDiligenceChecklistModel
        .findOne({ version })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get due diligence checklist by version ${version}: ${error.message}`);
      throw error;
    }
  }

  async getAll(): Promise<DueDiligenceChecklist[]> {
    try {
      return await this.dueDiligenceChecklistModel
        .find()
        .sort({ version: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get all due diligence checklists: ${error.message}`);
      throw error;
    }
  }
} 
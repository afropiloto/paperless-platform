import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { DealProcessing } from '../schemas/deal-processing.schema';
import { FundingDecisionType } from '../types/deal-desk.types';
import { Account } from '../../accounts/schemas/account.schema';
import { TradeFinance } from '../../trade-finance/schemas/trade-finance.schema';

class CheckListItemStatus {}

@Injectable()
export class DealProcessingRepository {
  private readonly logger = new Logger(DealProcessingRepository.name);

  constructor(
    @InjectModel(DealProcessing.name)
    private readonly dealProcessingModel: Model<DealProcessing>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
    @InjectModel(TradeFinance.name)
    private readonly tradeFinanceModel: Model<TradeFinance>,
  ) {}

  async create(dealProcessing: DealProcessing): Promise<DealProcessing> {
   this.logger.debug({dealProcessing})
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
      const aggregationPipeline: PipelineStage[] = [
        {
          $match: {
            _id: new Types.ObjectId(id)
          }
        },
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        {
          $lookup: {
            from: 'tradefinances',
            localField: 'dealId',
            foreignField: '_id',
            as: 'tradeFinance'
          }
        },
        {
          $lookup: {
            from: 'tradedocuments',
            let: { documentIds: { $arrayElemAt: ['$tradeFinance.documentIds', 0] } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $isArray: '$$documentIds' },
                      { $in: ['$_id', '$$documentIds'] }
                    ]
                  }
                }
              },
              {
                $project: {
                  _id: { $toString: '$_id' },
                  documentReference: 1,
                  documentType: 1,
                  status: 1
                }
              }
            ],
            as: 'invoices'
          }
        },
        {
          $addFields: {
            accountName: { $arrayElemAt: ['$account.accountName', 0] },
            invoiceTotal: { $arrayElemAt: ['$tradeFinance.totalValue', 0] },
            loanAmount: { $arrayElemAt: ['$tradeFinance.loanDetails.loanAmount', 0] },
            collateralAmount: { $arrayElemAt: ['$tradeFinance.loanDetails.loanCollateralAmount', 0] },
            loanTerm: { $arrayElemAt: ['$tradeFinance.loanDetails.loanDurationDays', 0] }
          }
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            dealId: { $toString: '$dealId' },
            accountId: { $toString: '$accountId' },
            accountName: 1,
            invoiceTotal: 1,
            loanAmount: 1,
            collateralAmount: 1,
            loanTerm: 1,
            status: 1,
            sections: 1,
            fundingDecision: 1,
            fundingDecisionNotes: 1,
            fundingDecisionDate: 1,
            createdAt: 1,
            updatedAt: 1,
            invoices: 1
          }
        }
      ];

      const result = await this.dealProcessingModel.aggregate(aggregationPipeline).exec();
      this.logger.debug({result})
      
      if (!result || result.length === 0) {
        throw new NotFoundException(`Deal processing with id ${id} not found`);
      }

      return result[0];
    } catch (error) {
      this.logger.error(`Failed to find deal processing by id ${id}: ${error.message}`);
      throw error;
    }
  }

  async findAll(): Promise<DealProcessing[]> {
    try {
      const aggregationPipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountId',
            foreignField: '_id',
            as: 'account'
          }
        },
        {
          $lookup: {
            from: 'tradefinances',
            localField: 'dealId',
            foreignField: '_id',
            as: 'tradeFinance'
          }
        },
        {
          $addFields: {
            accountName: { $arrayElemAt: ['$account.accountName', 0] },
            invoiceTotal: { $arrayElemAt: ['$tradeFinance.totalValue', 0] },
            loanAmount: { $arrayElemAt: ['$tradeFinance.loanDetails.loanAmount', 0] },
            collateralAmount: { $arrayElemAt: ['$tradeFinance.loanDetails.loanCollateralAmount', 0] },
            loanTerm: { $arrayElemAt: ['$tradeFinance.loanDetails.loanDurationDays', 0] }
          }
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            dealId: { $toString: '$dealId' },
            accountId: { $toString: '$accountId' },
            accountName: 1,
            invoiceTotal: 1,
            loanAmount: 1,
            collateralAmount: 1,
            loanTerm: 1,
            status: 1,
            sections: 1,
            fundingDecision: 1,
            fundingDecisionNotes: 1,
            fundingDecisionDate: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        {
          $sort: { updatedAt: -1 }
        }
      ];

      return await this.dealProcessingModel.aggregate(aggregationPipeline).exec();
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
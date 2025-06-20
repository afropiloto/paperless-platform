import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { DealProcessing } from './schemas/deal-processing.schema';
import { DealProcessingStatus, FundingDecisionType } from './types/deal-desk.types';
import { Account } from '../accounts/schemas/account.schema';
import { TradeFinance } from '../trade-finance/schemas/trade-finance.schema';
import { DealProcessingResponseDto, PromissoryNoteState, DealProcessingSearchResultsDto, DealProcessingSummaryResponseDto } from './dto/deal-processing-response.dto';
import { plainToInstance } from 'class-transformer';
import { NewDealProcessing } from './dto/create-deal-processing.dto';
import { SearchQueryDto, SortDirection } from '../common/dtos/search.dto';

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

  async create(dealProcessing: NewDealProcessing): Promise<DealProcessingResponseDto> {
    this.logger.debug({ dealProcessing });
    try {
      const createdDealProcessing = new this.dealProcessingModel(
        {...dealProcessing},
      );
      const newDeal =  await createdDealProcessing.save();
      return plainToInstance(DealProcessingResponseDto, newDeal);
    } catch (error) {
      this.logger.error(`Failed to create deal processing: ${error.message}`);
      throw error;
    }
  }

  

  async findById(id: string): Promise<DealProcessingResponseDto> {
    try {
      const aggregationPipeline: PipelineStage[] = [
        {
          $match: {
            _id: new Types.ObjectId(id),
          },
        },
        {
          $addFields: {
            accountIdObjectId: { $toObjectId: '$accountId' },
            dealIdObjectId: { $toObjectId: '$dealId' }
          }
        },
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountIdObjectId',
            foreignField: '_id',
            as: 'account',
          },
        },
        {
          $lookup: {
            from: 'tradefinances',
            localField: 'dealIdObjectId',
            foreignField: '_id',
            as: 'tradeFinance',
          },
        },
        {
          $addFields: {
            accountName: { $arrayElemAt: ['$account.accountName', 0] },
            invoiceTotal: { $arrayElemAt: ['$tradeFinance.totalValue', 0] },
            loanAmount: {
              $arrayElemAt: ['$tradeFinance.loanDetails.loanAmount', 0],
            },
            collateralAmount: {
              $arrayElemAt: [
                '$tradeFinance.loanDetails.loanCollateralAmount',
                0,
              ],
            },
            loanTerm: {
              $arrayElemAt: ['$tradeFinance.loanDetails.loanDurationDays', 0],
            },
          },
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
            dueDiligenceChecklistId: 1,
            promissoryNote: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const result = await this.dealProcessingModel
        .aggregate(aggregationPipeline)
        .exec();
      this.logger.debug({ result });

      if (!result || result.length === 0) {
        throw new NotFoundException(`Deal processing with id ${id} not found`);
      }


      return plainToInstance(DealProcessingResponseDto, result[0]);
    } catch (error) {
      this.logger.error(
        `Failed to find deal processing by id ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(searchParams?: SearchQueryDto): Promise<DealProcessingSearchResultsDto> {
    try {
      const {
        queryTerm,
        page = 1,
        limit = 10,
        orderBy = 'updatedAt',
        orderDirection = SortDirection.DESC
      } = searchParams || {};

      const skip = (page - 1) * limit;
      const sortDirection = orderDirection === SortDirection.ASC ? 1 : -1;

      // Build match stage for search
      const matchStage: any = {};
      if (queryTerm) {
        matchStage.$or = [
          { accountName: { $regex: queryTerm, $options: 'i' } },
          { dealReference: { $regex: queryTerm, $options: 'i' } },
          { status: { $regex: queryTerm, $options: 'i' } }
        ];
      }

      // Base pipeline with lookups and field additions
      const basePipeline: PipelineStage[] = [
        {
          $addFields: {
            accountIdObjectId: { $toObjectId: '$accountId' },
            dealIdObjectId: { $toObjectId: '$dealId' }
          }
        },
        {
          $lookup: {
            from: 'accounts',
            localField: 'accountIdObjectId',
            foreignField: '_id',
            as: 'account',
          },
        },
        {
          $lookup: {
            from: 'tradefinances',
            localField: 'dealIdObjectId',
            foreignField: '_id',
            as: 'tradeFinance',
          },
        },
        {
          $addFields: {
            accountName: { $arrayElemAt: ['$account.accountName', 0] },
            invoiceTotal: { $arrayElemAt: ['$tradeFinance.totalValue', 0] },
            dealReference: { $arrayElemAt: ['$tradeFinance.dealReference', 0] },
            loanAmount: {
              $arrayElemAt: ['$tradeFinance.loanDetails.loanAmount', 0],
            },
            collateralAmount: {
              $arrayElemAt: [
                '$tradeFinance.loanDetails.loanCollateralAmount',
                0,
              ],
            },
            loanTerm: {
              $arrayElemAt: ['$tradeFinance.loanDetails.loanDurationDays', 0],
            },
          },
        },
        {
          $project: {
            _id: { $toString: '$_id' },
            dealId: { $toString: '$dealId' },
            accountId: { $toString: '$accountId' },
            accountName: 1,
            invoiceTotal: 1,
            dealReference: 1,
            loanAmount: 1,
            collateralAmount: 1,
            loanTerm: 1,
            status: 1,
            sections: 1,
            fundingDecision: 1,
            dueDiligenceChecklistId: 1,
            promissoryNote: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      // Add search filter if query term exists
      if (Object.keys(matchStage).length > 0) {
        basePipeline.push({ $match: matchStage });
      }

      // Get total count for pagination
      const countPipeline = [...basePipeline, { $count: 'total' }];
      const totalRecords = await this.dealProcessingModel
        .aggregate(countPipeline)
        .exec();
      
      const total = totalRecords[0]?.total || 0;
      const totalPages = Math.ceil(total / limit);

      // Build data pipeline with sorting and pagination
      const dataPipeline: PipelineStage[] = [
        ...basePipeline,
        { $sort: { [orderBy]: sortDirection as 1 | -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      const results = await this.dealProcessingModel
        .aggregate(dataPipeline)
        .exec();

      const data = results.map(result => 
        plainToInstance(DealProcessingSummaryResponseDto, result, {
          excludeExtraneousValues: true,
        })
      );

      return {
        data,
        metadata: {
          page,
          totalPages,
          limit
        }
      };
    } catch (error) {
      this.logger.error(
        `Failed to find all deal processing records: ${error.message}`,
      );
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
      this.logger.debug({ decision });
      const dealDecision = this.getDealDecision(decision);
      const dealStatus = this.getDealProcessingStatus(dealDecision);

      this.logger.debug({ dealStatus });
      return await this.dealProcessingModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              fundingDecision: {
                decision: dealDecision,
                decisionNotes: {
                  note,
                  user,
                  createdAt: new Date()
                }
              },
              status: dealStatus,
            },
          },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to update funding decision for deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async savePromissoryNoteDetails(
    id: string,
    content: any,
    status: PromissoryNoteState,
    issuedFile?: any,
  ): Promise<DealProcessing> {
    try {
      const updateData: any = {
        'promissoryNote.content': content,
        'promissoryNote.status': status,
      };

      if (issuedFile) {
        updateData['promissoryNote.issuedFile'] = issuedFile;
      }

      return await this.dealProcessingModel
        .findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to save promissory note details for deal ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  private getDealProcessingStatus(decision: FundingDecisionType) {
    switch (decision) {
      case FundingDecisionType.APPROVED:
        return DealProcessingStatus.AWAITING_AGREEMENT;
      case FundingDecisionType.DECLINED:
        return DealProcessingStatus.REJECTED;
      default:
        return DealProcessingStatus.IN_PROGRESS;
    }
  }

  private getDealDecision(decision: FundingDecisionType) {
    switch (decision.toString().toLowerCase()) {
      case 'approve':
      case 'approved':
        return FundingDecisionType.APPROVED;
      case 'decline':
      case 'declined':
        return FundingDecisionType.DECLINED;
      default:
        return FundingDecisionType.PENDING;
    }
  }

  async getDealAnalytics(): Promise<{ totalNewDeals: number; totalInProgressDeals: number; totalAwaitingAgreementDeals: number }> {
    try {
      const pipeline: PipelineStage[] = [
        {
          $facet: {
            totalNewDeals: [
              {
                $match: {
                  status: DealProcessingStatus.NEW
                }
              },
              {
                $count: 'count'
              }
            ],
            totalInProgressDeals: [
              {
                $match: {
                  status: DealProcessingStatus.IN_PROGRESS
                }
              },
              {
                $count: 'count'
              }
            ],
            totalAwaitingAgreementDeals: [
              {
                $match: {
                  status: DealProcessingStatus.AWAITING_AGREEMENT
                }
              },
              {
                $count: 'count'
              }
            ]
          }
        }
      ];

      const [result] = await this.dealProcessingModel.aggregate(pipeline).exec();

      return {
        totalNewDeals: result.totalNewDeals[0]?.count || 0,
        totalInProgressDeals: result.totalInProgressDeals[0]?.count || 0,
        totalAwaitingAgreementDeals: result.totalAwaitingAgreementDeals[0]?.count || 0
      };
    } catch (error) {
      this.logger.error(`Failed to get deal analytics: ${error.message}`);
      throw error;
    }
  }
}
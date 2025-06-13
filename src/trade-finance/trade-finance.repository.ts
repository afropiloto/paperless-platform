import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { TradeDocument } from '../trade-documents/schema/trade-document.schema';
import { TradeFinance } from './schemas/trade-finance.schema';
import { plainToInstance } from 'class-transformer';
import { TradeDocumentStatus, TradeDocumentType } from '../types/trade-documents.types';
import { SearchQueryDto } from '../trade-documents/dtos/search-trade-documents.dto';
import { TradeFinanceDealDto } from './dtos/trade-finance-deal.dto';

const financeableTradeDocumentsStates = [TradeDocumentStatus.ISSUED]

@Injectable()
export class TradeFinanceRepository {
  private readonly logger = new Logger(TradeFinanceRepository.name);

  constructor(
    @InjectModel(TradeDocument.name) private tradeDocumentRepo: Model<TradeDocument>,
    @InjectModel(TradeFinance.name) private tradeFinanceRepo: Model<TradeFinance>
  ) {}

  async getAvailableFinanceableInvoiceDocuments(accountId: string, searchParams: SearchQueryDto, includes: string[]) {
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0);

    const includesProjection = { id: '$_id', createdAt: 1, updatedAt: 1 };
    includes.forEach((include) => {
      includesProjection[include] = 1;
    });

    const excludesProjection = { __v: 0, _id: 0 };

    const dataFacet = [];
    if (searchParams.orderBy !== undefined && searchParams.orderBy.length > 0) {
      dataFacet.push({
        $sort: {
          [searchParams.orderBy]:
            searchParams.orderDirection === 'desc' ? -1 : 1,
        },
      });
    }
    dataFacet.push({ $skip: (searchParams.page - 1) * searchParams.limit });
    dataFacet.push({ $limit: searchParams.limit });
    const searchableFields = ['status', 'documentType', 'documentReference'];

    const aggregationPipeline: PipelineStage[] = [];
    // Add filter to restrict data to the account wallet address

    aggregationPipeline.push(
      {
        $match: {
          accountId: accountId,
          status: { $in: financeableTradeDocumentsStates },
          documentType: { $in: [TradeDocumentType.INVOICE] },
          dealId: { $exists: false },
          'documentContent.dueDate': { $gte: currentDate }
        }
      },
      {
        $project: {
          ...includesProjection,
          documentContent: 1,
          _id: 0
        }
      },
      {
        $project: excludesProjection
      }
    );
    // Add filter criteria if a query term is provided
    if (
      searchParams.queryTerm !== undefined &&
      searchParams.queryTerm.length > 0
    ) {
      aggregationPipeline.push({
        $match: {
          $or: searchableFields.map((field) => ({
            [field]: { $regex: searchParams.queryTerm, $options: 'i' },
          })),
        },
      });
    }
    aggregationPipeline.push({
      $sort: { lastModified: -1 },
    });
    aggregationPipeline.push({
      $facet: {
        metadata: [
          {
            $count: 'totalDocuments',
          },
          {
            $addFields: {
              page: searchParams.page,
              totalPages: {
                $ceil: { $divide: ['$totalDocuments', searchParams.limit] },
              },
              limit: searchParams.limit,
            },
          },
        ],
        data: dataFacet,
      },
    });

    try {
      let result = await this.tradeDocumentRepo.aggregate(aggregationPipeline);
      result = result[0];
      // Deal with no data
      if (result['data'].length === 0) {
        result['metadata'] = {
          totalDocuments: 0,
          page: searchParams.page,
          totalPages: 0,
          limit: searchParams.limit,
        };
        result['data'] = [];
        return result;
      }
      result['metadata'] = { ...result['metadata'][0] };
      return result;
    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve Trade Documents for account',
        details: error.message,
        accountWallet: accountId,
        searchParams,
      });
      throw new Error(
        'We encountered an problem retrieving your trade documents. We have logged this issue please try again later',
      );
    }
  }

  async createDeal(accountId: string, dealData: Partial<TradeFinance>): Promise<TradeFinanceDealDto> {
    try {
      const deal = new this.tradeFinanceRepo({
        ...dealData,
        accountId,
      });
      const savedDeal = await deal.save();
      return plainToInstance(TradeFinanceDealDto, {id: savedDeal._id, ...savedDeal.toObject()}, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to create trade finance deal',
        details: error.message,
        accountId,
        dealData,
      });
      throw new Error('Failed to create trade finance deal');
    }
  }

  async getDealById(accountId: string, dealId: string): Promise<TradeFinanceDealDto> {
    try {
      const deal = await this.tradeFinanceRepo.findOne({ _id: dealId, accountId });
      if (!deal) {
        throw new NotFoundException('Trade finance deal not found');
      }
      return plainToInstance(TradeFinanceDealDto,  {id: deal._id, ...deal.toObject()}, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve trade finance deal',
        details: error.message,
        accountId,
        dealId,
      });
      throw error;
    }
  }

  async updateDeal(accountId: string, dealId: string, updateData: Partial<TradeFinance>): Promise<TradeFinanceDealDto> {
    try {
      const deal = await this.tradeFinanceRepo.findOneAndUpdate(
        { _id: dealId, accountId },
        { $set: updateData },
        { new: true }
      );
      if (!deal) {
        throw new NotFoundException('Trade finance deal not found');
      }
      return plainToInstance(TradeFinanceDealDto, {id: deal._id, ...deal.toObject()}, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error({
        msg: 'Failed to update trade finance deal',
        details: error.message,
        accountId,
        dealId,
        updateData,
      });
      throw error;
    }
  }

  async deleteDeal(accountId: string, dealId: string): Promise<void> {
    this.logger.debug({accountId, dealId});
      const result = await this.tradeFinanceRepo.findOneAndDelete({ _id: dealId, accountId });
      this.logger.debug(result);
      if (!result) {
        this.logger.error({
          msg: 'Failed to delete trade finance deal',
          details: "Trade Deal not found",
          accountId,
          dealId,
        });
        throw new NotFoundException('Trade finance deal not found');
      }
  }

  async getDealsByAccountId(accountId: string, searchParams: SearchQueryDto) {
    // Todo: this should be updated to use an aggregate rather than 2 separate queries
    try {
      const query: any = { accountId };
      
      if (searchParams.queryTerm) {
        query.dealReference = { $regex: searchParams.queryTerm, $options: 'i' };
      }

      const total = await this.tradeFinanceRepo.countDocuments(query);
      
      const deals = await this.tradeFinanceRepo
        .find(query)
        .sort({ [searchParams.orderBy || 'createdAt']: searchParams.orderDirection === 'desc' ? -1 : 1 })
        .skip((searchParams.page - 1) * searchParams.limit)
        .limit(searchParams.limit);

      const transformedDeals = deals.map(deal => 
        plainToInstance(TradeFinanceDealDto, {id: deal._id, ...deal.toObject()}, { excludeExtraneousValues: true })
      );

      return {
        metadata: {
          totalDocuments: total,
          page: searchParams.page,
          totalPages: Math.ceil(total / searchParams.limit),
          limit: searchParams.limit,
        },
        data: transformedDeals,
      };
    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve trade finance deals for account',
        details: error.message,
        accountId,
        searchParams,
      });
      throw new Error('Failed to retrieve trade finance deals');
    }
  }
}
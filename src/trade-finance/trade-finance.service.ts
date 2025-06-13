import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TradeFinanceRepository } from './trade-finance.repository';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto, TradeDocumentsSearchResultsDto } from '../trade-documents/dtos/search-trade-documents.dto';
import { TRADE_DOCUMENT_SUMMARY_INCLUDE_FIELDS } from '../trade-documents/trade-document.constants';
import { CreateTradeFinanceDealDto } from './dtos/create-trade-finance-deal.dto';
import { TradeFinanceDealDto } from './dtos/trade-finance-deal.dto';
import { SubmitTradeDetailFundingDto } from './dtos/submit-trade-detail-funding.dto';
import { TradeFinanceDealStatus } from './types/trade-finance.types';

@Injectable()
export class TradeFinanceService {
  private readonly logger = new Logger(TradeFinanceService.name);

  constructor(private readonly tradeFinanceRepository: TradeFinanceRepository) {}

  async getAvailableFinanceableDocuments(accountId: string, searchParams: SearchQueryDto) {
    const includes = []
    includes.push(...TRADE_DOCUMENT_SUMMARY_INCLUDE_FIELDS)
    const results = await this.tradeFinanceRepository.getAvailableFinanceableInvoiceDocuments(
      accountId,
      searchParams,
      includes);

    return results
      ? plainToInstance(TradeDocumentsSearchResultsDto, results)
      : {
        metadata: {
          totalDocuments: 0,
          page: searchParams.page,
          totalPages: 0,
          limit: searchParams.limit,
        },
        data: [],
      };
  }

  async createDeal(accountId: string, createDealDto: CreateTradeFinanceDealDto): Promise<TradeFinanceDealDto> {
    try {
      return await this.tradeFinanceRepository.createDeal(accountId, createDealDto);
    } catch (error) {
      this.logger.error({
        msg: 'Failed to create trade finance deal in service',
        details: error.message,
        accountId,
        createDealDto,
      });
      throw error;
    }
  }

  async getDealById(accountId: string, dealId: string): Promise<TradeFinanceDealDto> {
    try {
      const deal = await this.tradeFinanceRepository.getDealById(accountId, dealId);
      if (!deal) {
        throw new NotFoundException(`Trade finance deal with ID ${dealId} not found`);
      }
      return deal;
    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve trade finance deal in service',
        details: error.message,
        accountId,
        dealId,
      });
      throw error;
    }
  }

  async updateDeal(
    accountId: string,
    dealId: string,
    updateDealDto: Partial<CreateTradeFinanceDealDto>
  ): Promise<TradeFinanceDealDto> {
    try {
      const deal = await this.tradeFinanceRepository.updateDeal(accountId, dealId, updateDealDto);
      if (!deal) {
        throw new NotFoundException(`Trade finance deal with ID ${dealId} not found`);
      }
      return deal;
    } catch (error) {
      this.logger.error({
        msg: 'Failed to update trade finance deal in service',
        details: error.message,
        accountId,
        dealId,
        updateDealDto,
      });
      throw error;
    }
  }

  async deleteDeal(accountId: string, dealId: string): Promise<void> {
    try {
      await this.tradeFinanceRepository.deleteDeal(accountId, dealId);
    } catch (error) {
      this.logger.error({
        msg: 'Failed to delete trade finance deal in service',
        details: error.message,
        accountId,
        dealId,
      });
      throw error;
    }
  }

  async getDealsByAccountId(accountId: string, searchParams: SearchQueryDto) {
    try {
      const result = await this.tradeFinanceRepository.getDealsByAccountId(accountId, searchParams);
      return {
        metadata: {
          totalDocuments: result.metadata.totalDocuments,
          page: result.metadata.page,
          totalPages: result.metadata.totalPages,
          limit: result.metadata.limit,
        },
        data: result.data,
      };
    } catch (error) {
      this.logger.error({
        msg: 'Failed to retrieve trade finance deals in service',
        details: error.message,
        accountId,
        searchParams,
      });
      throw error;
    }
  }

  async requestFunding(accountId: string, dealId: string) {
    
    const dealDetails = await this.tradeFinanceRepository.getDealById(accountId, dealId);
    // check deal exists 
    if (!dealDetails) {throw new NotFoundException("Trade Deal not found")}
    // check deal is in the correct state
    if (dealDetails.dealStatus !== TradeFinanceDealStatus.IN_PROGRESS) {throw new BadRequestException(
      `This trade deal cannot be submitted for funding as it has a state of ${dealDetails.dealStatus} rather than ${TradeFinanceDealStatus.IN_PROGRESS}`,
    )}
    // update deal status
    await this.tradeFinanceRepository.updateDeal(accountId, dealId, { dealStatus: TradeFinanceDealStatus.FUNDING_REQUESTED });
  }

  async withdrawFunding(accountId: string, dealId: string) {
    const allowedStates = [ TradeFinanceDealStatus.FUNDING_REQUESTED ];
    const dealDetails = await this.tradeFinanceRepository.getDealById(accountId, dealId);
    // check deal exists
    if (!dealDetails) {throw new NotFoundException("Trade Deal not found")}
    // check deal is in the correct state
    if (!allowedStates.includes(dealDetails.dealStatus)) {throw new BadRequestException(
      `This trade deal cannot be submitted for funding as it has a state of ${dealDetails.dealStatus} rather than one of the following: ${allowedStates.join(', ')}`,
    )}
    // update deal status
    await this.tradeFinanceRepository.updateDeal(accountId, dealId, { dealStatus: TradeFinanceDealStatus.IN_PROGRESS });
  }
}

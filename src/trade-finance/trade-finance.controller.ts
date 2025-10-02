import { Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { TradeFinanceService } from './trade-finance.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTradeFinanceDealDto } from './dtos/create-trade-finance-deal.dto';
import { TradeFinanceDealDto } from './dtos/trade-finance-deal.dto';
import { TradeFinanceSearchResultsDto } from './dtos/trade-finance-search-results.dto';
import { plainToInstance } from 'class-transformer';
import { SubmitTradeDetailFundingDto } from './dtos/submit-trade-detail-funding.dto';
import { TradeDetailFundingAction } from './types/trade-finance.types';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Trade Finance')
@Controller('trade-finance')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAIPERLESS_APP)
@ApiBearerAuth()
export class TradeFinanceController {
  private readonly logger = new Logger(TradeFinanceController.name);

  constructor(private readonly tradeFinanceService: TradeFinanceService) {}

  @Get('/:accountId/trade-documents/available')
  @ApiOperation({
    summary:
      'Retrieves a trade documents that are available for finance for an account',
  })
  @ApiResponse({ status: 200, description: 'Trade Document details retrieved' })
  @ApiResponse({
    status: 400,
    description: 'AccountId is invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Account could not be found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve Trade Document details',
  })
  @ApiQuery({ type: SearchQueryDto })
  async getTradeDocumentById(
    @Param('accountId') accountId: string,
    @Query() searchParams: SearchQueryDto,
  ) {
    return await this.tradeFinanceService.getAvailableFinanceableDocuments(
        accountId,
        searchParams,
      );
  }

  @Post('/:accountId/deals')
  @ApiOperation({
    summary: 'Create a new trade finance deal for an account',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Trade finance deal created successfully',
    type: TradeFinanceDealDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to create trade finance deal',
  })
  async createDeal(
    @Param('accountId') accountId: string,
    @Body() createDealDto: CreateTradeFinanceDealDto,
  ): Promise<TradeFinanceDealDto> {
    return await this.tradeFinanceService.createDeal(accountId, createDealDto);

  }

  @Get('/:accountId/deals/:dealId')
  @ClientAccess(ClientAccessGroup.PAIPERLESS_PORTAL)
  @ApiOperation({
    summary: 'Retrieve a specific trade finance deal',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiParam({
    name: 'dealId',
    description: 'The ID of the trade finance deal',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Trade finance deal retrieved successfully',
    type: TradeFinanceDealDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Trade finance deal not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve trade finance deal',
  })
  async getDealById(
    @Param('accountId') accountId: string,
    @Param('dealId') dealId: string,
  ): Promise<TradeFinanceDealDto> {
    return await this.tradeFinanceService.getDealById(accountId, dealId);

  }

  @Put('/:accountId/deals/:dealId')
  @ApiOperation({
    summary: 'Update an existing trade finance deal',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiParam({
    name: 'dealId',
    description: 'The ID of the trade finance deal',
    type: String,
  })
  @ApiBody({
    type: CreateTradeFinanceDealDto,
    description: 'The trade finance deal data to update',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Trade finance deal updated successfully',
    type: TradeFinanceDealDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Trade finance deal not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to update trade finance deal',
  })
  async updateDeal(
    @Param('accountId') accountId: string,
    @Param('dealId') dealId: string,
    @Body() updateDealDto: Partial<CreateTradeFinanceDealDto>,
  ): Promise<TradeFinanceDealDto> {
    return await this.tradeFinanceService.updateDeal(accountId, dealId, updateDealDto);

  }

  @Delete('/:accountId/deals/:dealId')
  @ApiOperation({
    summary: 'Delete a trade finance deal',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiParam({
    name: 'dealId',
    description: 'The ID of the trade finance deal',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Trade finance deal deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade finance deal not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to delete trade finance deal',
  })
  async deleteDeal(
    @Param('accountId') accountId: string,
    @Param('dealId') dealId: string,
  ): Promise<void> {
    await this.tradeFinanceService.deleteDeal(accountId, dealId);
  }

  @Get('/:accountId/deals')
  @ApiOperation({
    summary: 'Retrieve a list of trade finance deals for an account',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiQuery({ type: SearchQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Trade finance deals retrieved successfully',
    type: TradeFinanceSearchResultsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve trade finance deals',
  })
  async getDealsByAccountId(
    @Param('accountId') accountId: string,
    @Query() searchParams: SearchQueryDto,
  ): Promise<TradeFinanceSearchResultsDto> {
    try {
      const result = await this.tradeFinanceService.getDealsByAccountId(accountId, searchParams);
      return plainToInstance(TradeFinanceSearchResultsDto, result, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Error retrieving deals:', error);
      throw error;
    }
  }

  @Post('/:accountId/deals/:dealId/actions')
  @ApiOperation({
    summary: 'Submit an action request (request for funding or withraw funding request)for a trade detail',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiParam({
    name: 'dealId',
    description: 'The ID of the trade finance deal',
    type: String,
  })
  @ApiBody({
    type: SubmitTradeDetailFundingDto,
    description: 'The funding request details',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Trade detail funding request submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Trade finance deal not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to submit trade detail funding',
  })
  async submitTradeDetailFunding(
    @Param('accountId') accountId: string,
    @Param('dealId') dealId: string,
    @Body() submitFundingDto: SubmitTradeDetailFundingDto,
  ): Promise<void> {
    if(submitFundingDto.action === TradeDetailFundingAction.FUNDING_REQUEST){
      await this.tradeFinanceService.requestFunding(accountId, dealId);
    }else if(submitFundingDto.action === TradeDetailFundingAction.WITHDRAW_REQUEST){
      await this.tradeFinanceService.withdrawFunding(accountId, dealId);
    }
  }
}

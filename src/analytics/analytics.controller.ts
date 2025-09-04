import { Controller, Get, Logger, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { 
  RecentTradeDocumentDto, 
  RecentTradeFinanceDealDto, 
  TradeDocumentsSummaryDto, 
  TradeFinanceSummaryDto,
  LimitQueryDto,
  SinceQueryDto
} from './dtos/analytics.dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAIPERLESS_APP)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('/:accountId/trade-documents/recent')
  @ApiOperation({
    summary: 'Get the most recently updated trade documents for an account',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of documents to retrieve',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent trade documents retrieved successfully',
    type: [RecentTradeDocumentDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve analytics',
  })
  async getRecentTradeDocuments(
    @Param('accountId') accountId: string,
    @Query() query: LimitQueryDto,
  ): Promise<RecentTradeDocumentDto[]> {
    this.logger.log(`Getting recent trade documents for account ${accountId} with limit ${query.limit}`);
    return await this.analyticsService.getRecentTradeDocuments(accountId, query.limit);
  }

  @Get('/:accountId/trade-finance/recent')
  @ApiOperation({
    summary: 'Get the most recently updated trade finance deals for an account',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of deals to retrieve',
    type: Number,
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent trade finance deals retrieved successfully',
    type: [RecentTradeFinanceDealDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve analytics',
  })
  async getRecentTradeFinanceDeals(
    @Param('accountId') accountId: string,
    @Query() query: LimitQueryDto,
  ): Promise<RecentTradeFinanceDealDto[]> {
    this.logger.log(`Getting recent trade finance deals for account ${accountId} with limit ${query.limit}`);
    return await this.analyticsService.getRecentTradeFinanceDeals(accountId, query.limit);
  }

  @Get('/:accountId/trade-documents/summary')
  @ApiOperation({
    summary: 'Get summary of trade documents created since a given date',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiQuery({
    name: 'since',
    description: 'Date to start summary from (ISO string)',
    type: String,
    required: true,
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade documents summary retrieved successfully',
    type: TradeDocumentsSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve analytics',
  })
  async getTradeDocumentsSummary(
    @Param('accountId') accountId: string,
    @Query() query: SinceQueryDto,
  ): Promise<TradeDocumentsSummaryDto> {
    this.logger.log(`Getting trade documents summary for account ${accountId} since ${query.since}`);
    const sinceDate = new Date(query.since);
    return await this.analyticsService.getTradeDocumentsSummary(accountId, sinceDate);
  }

  @Get('/:accountId/trade-finance/summary')
  @ApiOperation({
    summary: 'Get summary of trade finance deals created since a given date',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiQuery({
    name: 'since',
    description: 'Date to start summary from (ISO string)',
    type: String,
    required: true,
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Trade finance summary retrieved successfully',
    type: TradeFinanceSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve analytics',
  })
  async getTradeFinanceSummary(
    @Param('accountId') accountId: string,
    @Query() query: SinceQueryDto,
  ): Promise<TradeFinanceSummaryDto> {
    this.logger.log(`Getting trade finance summary for account ${accountId} since ${query.since}`);
    const sinceDate = new Date(query.since);
    return await this.analyticsService.getTradeFinanceSummary(accountId, sinceDate);
  }

  @Get('/:accountId/trade-documents/summary/debug')
  @ApiOperation({
    summary: 'Debug endpoint to get summary of all trade documents without date filtering',
  })
  @ApiParam({
    name: 'accountId',
    description: 'The ID of the account',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Trade documents debug summary retrieved successfully',
    type: TradeDocumentsSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized to retrieve analytics',
  })
  async getTradeDocumentsSummaryDebug(
    @Param('accountId') accountId: string,
  ): Promise<TradeDocumentsSummaryDto> {
    this.logger.log(`Getting trade documents debug summary for account ${accountId}`);
    return await this.analyticsService.getTradeDocumentsSummaryDebug(accountId);
  }
} 
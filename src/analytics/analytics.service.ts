import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TradeDocument } from '../trade-documents/schema/trade-document.schema';
import { TradeFinance } from '../trade-finance/schemas/trade-finance.schema';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
import { TradeFinanceService } from '../trade-finance/trade-finance.service';
import { 
  RecentTradeDocumentDto, 
  RecentTradeFinanceDealDto, 
  TradeDocumentsSummaryDto, 
  TradeFinanceSummaryDto 
} from './dtos/analytics.dto';
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto, SortDirection } from '../common/dtos/search.dto';
import { TradeDocumentStatus } from '../types/trade-documents.types';
import { TradeFinanceDealStatus } from '../trade-finance/types/trade-finance.types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(TradeDocument.name) private tradeDocumentModel: Model<TradeDocument>,
    @InjectModel(TradeFinance.name) private tradeFinanceModel: Model<TradeFinance>,
    private readonly tradeDocumentsService: TradeDocumentsService,
    private readonly tradeFinanceService: TradeFinanceService,
  ) {}

  async getRecentTradeDocuments(accountId: string, limit: number = 10): Promise<RecentTradeDocumentDto[]> {
    this.logger.log(`Getting ${limit} most recent trade documents for account ${accountId}`);

    const searchParams: SearchQueryDto = {
      page: 1,
      limit: limit,
      orderBy: 'updatedAt',
      orderDirection: SortDirection.DESC
    };

    const results = await this.tradeDocumentsService.searchTradeDocumentsByAccountId(
      accountId,
      searchParams,
      ['documentReference', 'status', 'documentType', 'createdAt', 'updatedAt']
    );


    const data = 'data' in results ? results.data : [];
    this.logger.debug({data})
    return data.map(doc => plainToInstance(RecentTradeDocumentDto, {
      id: doc.id,
      documentReference: doc.documentReference,
      status: doc.status,
      documentType: doc.documentType,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  }

  async getRecentTradeFinanceDeals(accountId: string, limit: number = 10): Promise<RecentTradeFinanceDealDto[]> {
    this.logger.log(`Getting ${limit} most recent trade finance deals for account ${accountId}`);

    const searchParams: SearchQueryDto = {
      page: 1,
      limit: limit,
      orderBy: 'updatedAt',
      orderDirection: SortDirection.DESC
    };

    const results = await this.tradeFinanceService.getDealsByAccountId(accountId, searchParams);

    return results.data.map(deal => plainToInstance(RecentTradeFinanceDealDto, {
      id: deal.id,
      dealReference: deal.dealReference,
      dealStatus: deal.dealStatus,
      totalValue: deal.totalValue,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt
    }));
  }

  async getTradeDocumentsSummary(accountId: string, sinceDate: Date): Promise<TradeDocumentsSummaryDto> {
    this.logger.log(`Getting trade documents summary for account ${accountId} since ${sinceDate}`);

    // Log the query we're about to execute
    this.logger.log(`Query: { accountId: "${accountId}", createdAt: { $gte: ${sinceDate.toISOString()} } }`);

    // First, let's get all documents for this account to see what statuses exist
    const allDocuments = await this.tradeDocumentModel.find({ accountId }).select('status createdAt');
    this.logger.log(`All documents for account ${accountId}: ${allDocuments.length}`);
    
    if (allDocuments.length === 0) {
      this.logger.log(`No documents found for account ${accountId}`);
      const result = new TradeDocumentsSummaryDto();
      result.total = 0;
      return result;
    }
    
    const uniqueStatuses = [...new Set(allDocuments.map(doc => doc.status))];
    this.logger.log(`Unique statuses found: ${JSON.stringify(uniqueStatuses)}`);
    this.logger.log(`Expected enum values: ${JSON.stringify(Object.values(TradeDocumentStatus))}`);

    const documents = await this.tradeDocumentModel.find({
      accountId,
      createdAt: { $gte: sinceDate }
    }).select('status createdAt');

    this.logger.log(`Found ${documents.length} documents for summary after date filtering`);
    
    // Let's also check what the date range looks like
    const oldestDoc = allDocuments.reduce((oldest, current) => 
      (current as any).createdAt < (oldest as any).createdAt ? current : oldest
    );
    const newestDoc = allDocuments.reduce((newest, current) => 
      (current as any).createdAt > (newest as any).createdAt ? current : newest
    );
    
    this.logger.log(`Date range: ${(oldestDoc as any).createdAt} to ${(newestDoc as any).createdAt}`);
    this.logger.log(`Filtering since: ${sinceDate.toISOString()}`);
    
    const result = new TradeDocumentsSummaryDto();
    let total = 0;

    documents.forEach(doc => {
      const status = doc.status || 'unknown';
      this.logger.log(`Document: status=${status}, createdAt=${(doc as any).createdAt}`);
      
      switch (status) {
        case TradeDocumentStatus.IN_PROGRESS:
          result.inProgress++;
          break;
        case TradeDocumentStatus.READY_TO_ISSUE:
          result.readyToIssue++;
          break;
        case TradeDocumentStatus.ISSUED:
          result.issued++;
          break;
        case TradeDocumentStatus.SIGNED:
          result.signed++;
          break;
        case TradeDocumentStatus.PROCESSING:
          result.processing++;
          break;
        default:
          this.logger.warn(`Unknown status: ${status}`);
          break;
      }
      total++;
    });

    result.total = total;
    this.logger.log(`Summary result: inProgress=${result.inProgress}, readyToIssue=${result.readyToIssue}, issued=${result.issued}, signed=${result.signed}, processing=${result.processing}, total=${result.total}`);
    return result;
  }

  async getTradeFinanceSummary(accountId: string, sinceDate: Date): Promise<TradeFinanceSummaryDto> {
    this.logger.log(`Getting trade finance summary for account ${accountId} since ${sinceDate}`);

    const deals = await this.tradeFinanceModel.find({
      accountId,
      createdAt: { $gte: sinceDate }
    }).select('dealStatus');

    const result = new TradeFinanceSummaryDto();
    let total = 0;

    deals.forEach(deal => {
      const status = deal.dealStatus || 'unknown';
      
      switch (status) {
        case TradeFinanceDealStatus.IN_PROGRESS:
          result.inProgress++;
          break;
        case TradeFinanceDealStatus.FUNDING_REQUESTED:
          result.fundingRequested++;
          break;
        case TradeFinanceDealStatus.FUNDING_APPROVED:
          result.fundingApproved++;
          break;
        case TradeFinanceDealStatus.FUNDING_REJECTED:
          result.fundingRejected++;
          break;
        default:
          this.logger.warn(`Unknown deal status: ${status}`);
          break;
      }
      total++;
    });

    result.total = total;
    return result;
  }

  // Debug method to test basic functionality without date filtering
  async getTradeDocumentsSummaryDebug(accountId: string): Promise<TradeDocumentsSummaryDto> {
    this.logger.log(`Getting trade documents summary debug for account ${accountId}`);

    const documents = await this.tradeDocumentModel.find({ accountId }).select('status');
    this.logger.log(`Found ${documents.length} documents for debug summary`);
    
    const result = new TradeDocumentsSummaryDto();
    let total = 0;

    documents.forEach(doc => {
      const status = doc.status || 'unknown';
      this.logger.log(`Document status: ${status}`);
      
      switch (status) {
        case TradeDocumentStatus.IN_PROGRESS:
          result.inProgress++;
          break;
        case TradeDocumentStatus.READY_TO_ISSUE:
          result.readyToIssue++;
          break;
        case TradeDocumentStatus.ISSUED:
          result.issued++;
          break;
        case TradeDocumentStatus.SIGNED:
          result.signed++;
          break;
        case TradeDocumentStatus.PROCESSING:
          result.processing++;
          break;
        default:
          this.logger.warn(`Unknown status: ${status}`);
          break;
      }
      total++;
    });

    result.total = total;
    this.logger.log(`Debug summary result: inProgress=${result.inProgress}, readyToIssue=${result.readyToIssue}, issued=${result.issued}, signed=${result.signed}, processing=${result.processing}, total=${result.total}`);
    return result;
  }
} 
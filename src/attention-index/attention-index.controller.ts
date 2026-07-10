import { Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttentionIndexService } from './attention-index.service';
import {
  AuditEventDto,
  ConstituentDto,
  DashboardSummaryDto,
  HistoryQueryDto,
  IndexHistoryPointDto,
  IndexSnapshotDto,
} from './dtos/attention-index.dto';

@ApiTags('Attention Index (ATTN)')
@Controller('attention-index')
export class AttentionIndexController {
  private readonly logger = new Logger(AttentionIndexController.name);

  constructor(private readonly attentionIndexService: AttentionIndexService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get ATTN ticker dashboard summary' })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  async getDashboard(): Promise<DashboardSummaryDto> {
    return this.attentionIndexService.getDashboardSummary();
  }

  @Get('snapshot')
  @ApiOperation({ summary: 'Get latest index snapshot with full constituent breakdown' })
  @ApiResponse({ status: 200, type: IndexSnapshotDto })
  async getSnapshot(): Promise<IndexSnapshotDto> {
    return this.attentionIndexService.getLatestSnapshot();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get historical index values for charting' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, type: [IndexHistoryPointDto] })
  async getHistory(@Query() query: HistoryQueryDto): Promise<IndexHistoryPointDto[]> {
    return this.attentionIndexService.getHistory(query.days ?? 30);
  }

  @Get('constituents')
  @ApiOperation({ summary: 'List index basket constituents' })
  @ApiResponse({ status: 200, type: [ConstituentDto] })
  async getConstituents(): Promise<ConstituentDto[]> {
    return this.attentionIndexService.getConstituents();
  }

  @Get('methodology')
  @ApiOperation({ summary: 'Get transparent methodology documentation for regulatory review' })
  async getMethodology() {
    return this.attentionIndexService.getMethodology();
  }

  @Get('audit-trail')
  @ApiOperation({ summary: 'Get regulatory audit trail of index events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [AuditEventDto] })
  async getAuditTrail(@Query('limit') limit?: number): Promise<AuditEventDto[]> {
    return this.attentionIndexService.getAuditTrail(limit ? Number(limit) : 50);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Trigger manual index recalculation' })
  @ApiResponse({ status: 201, type: IndexSnapshotDto })
  async recalculate(): Promise<IndexSnapshotDto> {
    this.logger.log('Manual ATTN index recalculation triggered');
    return this.attentionIndexService.recalculateIndex();
  }
}

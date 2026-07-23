import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt-guard';
import { ApiKeyGuard } from '../api-key-auth/api-key.guard';
import { ClientAccess } from '../api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from '../api-key-auth/types/api-key-auth.types';
import { DvpSettlementService } from './dvp-settlement.service';
import {
  AgentOrchestrationResponseDto,
  ConfirmPaymentDto,
  CreateDvpSettlementDto,
  DvpSettlementDto,
  PaymentInstructionsDto,
} from './dtos/dvp-settlement.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';

@ApiTags('mLETR DvP Settlement')
@Controller('mletr-dvp')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
})
@ClientAccess(ClientAccessGroup.PAPERLESS_APP)
@ApiBearerAuth()
export class DvpSettlementController {
  private readonly logger = new Logger(DvpSettlementController.name);

  constructor(private readonly dvpSettlementService: DvpSettlementService) {}

  @Post('/:accountId/settlements')
  @ApiOperation({ summary: 'Create a new mLETR DvP settlement linking a trade document to stablecoin payment' })
  @ApiParam({ name: 'accountId', type: String })
  @ApiResponse({ status: 201, type: DvpSettlementDto })
  async createSettlement(
    @Param('accountId') accountId: string,
    @Body() dto: CreateDvpSettlementDto,
  ): Promise<DvpSettlementDto> {
    return this.dvpSettlementService.createSettlement(accountId, dto);
  }

  @Get('/:accountId/settlements')
  @ApiOperation({ summary: 'List DvP settlements for an account' })
  @ApiParam({ name: 'accountId', type: String })
  async listSettlements(
    @Param('accountId') accountId: string,
    @Query() searchParams: SearchQueryDto,
  ) {
    return this.dvpSettlementService.listSettlements(accountId, searchParams);
  }

  @Get('/:accountId/settlements/:settlementId')
  @ApiOperation({ summary: 'Get DvP settlement details including agent decisions and on-chain tx hashes' })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'settlementId', type: String })
  @ApiResponse({ status: 200, type: DvpSettlementDto })
  async getSettlement(
    @Param('accountId') accountId: string,
    @Param('settlementId') settlementId: string,
  ): Promise<DvpSettlementDto> {
    return this.dvpSettlementService.getSettlement(accountId, settlementId);
  }

  @Post('/:accountId/settlements/:settlementId/initiate')
  @ApiOperation({
    summary: 'Initiate agentic DvP settlement — agent validates mLETR compliance and extracts payment terms from parsed document',
  })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'settlementId', type: String })
  @ApiResponse({ status: 200, type: AgentOrchestrationResponseDto })
  async initiateSettlement(
    @Param('accountId') accountId: string,
    @Param('settlementId') settlementId: string,
  ): Promise<AgentOrchestrationResponseDto> {
    return this.dvpSettlementService.initiateSettlement(accountId, settlementId);
  }

  @Get('/:accountId/settlements/:settlementId/payment-instructions')
  @ApiOperation({ summary: 'Get stablecoin payment instructions for buyer to deposit into escrow' })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'settlementId', type: String })
  @ApiResponse({ status: 200, type: PaymentInstructionsDto })
  async getPaymentInstructions(
    @Param('accountId') accountId: string,
    @Param('settlementId') settlementId: string,
  ): Promise<PaymentInstructionsDto> {
    return this.dvpSettlementService.getPaymentInstructions(accountId, settlementId);
  }

  @Post('/:accountId/settlements/:settlementId/confirm-payment')
  @ApiOperation({ summary: 'Confirm stablecoin payment received in escrow — triggers DvP document transfer' })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'settlementId', type: String })
  async confirmPayment(
    @Param('accountId') accountId: string,
    @Param('settlementId') settlementId: string,
    @Body() dto: ConfirmPaymentDto,
  ): Promise<DvpSettlementDto> {
    return this.dvpSettlementService.confirmPayment(
      accountId,
      settlementId,
      dto.paymentTxHash,
    );
  }

  @Post('/:accountId/settlements/:settlementId/execute')
  @ApiOperation({
    summary: 'Execute DvP settlement — transfer document title and release stablecoin payment to seller',
  })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'settlementId', type: String })
  async executeSettlement(
    @Param('accountId') accountId: string,
    @Param('settlementId') settlementId: string,
  ): Promise<DvpSettlementDto> {
    return this.dvpSettlementService.executeSettlement(accountId, settlementId);
  }

  @Post('/:accountId/settlements/:settlementId/cancel')
  @ApiOperation({ summary: 'Cancel a pending DvP settlement' })
  @ApiParam({ name: 'accountId', type: String })
  @ApiParam({ name: 'settlementId', type: String })
  async cancelSettlement(
    @Param('accountId') accountId: string,
    @Param('settlementId') settlementId: string,
  ): Promise<DvpSettlementDto> {
    return this.dvpSettlementService.cancelSettlement(accountId, settlementId);
  }
}

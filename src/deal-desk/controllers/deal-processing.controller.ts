import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus, Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DealProcessingService } from '../services/deal-processing.service';
import { ChecklistItemUpdateDto } from '../dto/update-checklist.dto';
import {
  DealProcessingResponseDto,
  DealProcessingSummaryResponseDto,
} from '../dto/deal-processing-response.dto';
import { plainToInstance } from 'class-transformer';
import { CreateDealProcessingDto } from '../dto/create-deal-processing.dto';
import { FundingDecisionType } from '../types/deal-desk.types';

@ApiTags('Deal Processing')
@Controller('deal-processing')
export class DealProcessingController {
  private readonly logger = new Logger(DealProcessingController.name)
  constructor(
    private readonly dealProcessingService: DealProcessingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal processing record' })
  @ApiBody({ type: CreateDealProcessingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The deal processing record has been successfully created.',
    type: DealProcessingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No due diligence checklist found.',
  })
  async createDealProcessing(
    @Body() createDto: CreateDealProcessingDto,
  ): Promise<DealProcessingResponseDto> {
    const dealProcessing = await this.dealProcessingService.createDealProcessing(createDto);
    return plainToInstance(DealProcessingResponseDto, dealProcessing, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal processing details by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the deal processing record',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the deal processing details',
    type: DealProcessingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal processing record not found',
  })
  async getDealProcessing(
    @Param('id') id: string,
  ): Promise<DealProcessingResponseDto> {
    const dealProcessing = await this.dealProcessingService.getDealProcessing(id);
    this.logger.debug({dealProcessing})
    return plainToInstance(DealProcessingResponseDto, dealProcessing, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get list of all deal processing records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of deal processing records',
    type: [DealProcessingSummaryResponseDto],
  })
  async getDealProcessingList(): Promise<DealProcessingSummaryResponseDto[]> {
    const dealProcessingList = await this.dealProcessingService.getDealProcessingList();

    return plainToInstance(DealProcessingSummaryResponseDto, dealProcessingList, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/funding-decision')
  @ApiOperation({ summary: 'Update funding decision for a deal' })
  @ApiParam({
    name: 'id',
    description: 'ID of the deal processing record',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        decision: {
          type: 'string',
          enum: Object.values(FundingDecisionType),
          example: FundingDecisionType.APPROVED,
        },
        note: {
          type: 'string',
          example: 'All checks completed and documentation verified',
        },
        user: {
          type: 'string',
          example: 'user123',
        },
      },
      required: ['decision', 'note', 'user'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Funding decision updated successfully',
    type: DealProcessingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal processing record not found',
  })
  async updateFundingDecision(
    @Param('id') id: string,
    @Body() body: { decision: FundingDecisionType; note: string; user: string },
  ): Promise<DealProcessingResponseDto> {
    const dealProcessing = await this.dealProcessingService.updateFundingDecision(
      id,
      body.decision,
      body.note,
      body.user,
    );
    return plainToInstance(DealProcessingResponseDto, dealProcessing, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Update checklist items for a deal' })
  @ApiParam({
    name: 'id',
    description: 'ID of the deal processing record',
    type: 'string',
  })
  @ApiBody({
    type: [ChecklistItemUpdateDto],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checklist items updated successfully',
    type: DealProcessingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal processing record or checklist item not found',
  })
  async updateChecklist(
    @Param('id') id: string,
    @Body() updates: ChecklistItemUpdateDto[],
  ): Promise<DealProcessingResponseDto> {
    const dealProcessing = await this.dealProcessingService.updateChecklist(
      id,
      updates,
    );
    return plainToInstance(DealProcessingResponseDto, dealProcessing, {
      excludeExtraneousValues: true,
    });
  }
} 
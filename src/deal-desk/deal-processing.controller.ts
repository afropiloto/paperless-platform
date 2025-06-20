import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Res,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { DealProcessingService } from './deal-processing.service';
import { ChecklistItemUpdateDto } from '../due-diligence-checklists/dtos/update-checklist.dto';
import {
  DealProcessingResponseDto,
  DealProcessingSearchResultsDto,
} from './dto/deal-processing-response.dto';
import { plainToInstance } from 'class-transformer';
import { CreateDealProcessingDto } from './dto/create-deal-processing.dto';
import { FundingDecisionType } from './types/deal-desk.types';
import { UpdatePromissoryNoteDto } from './dto/update-promissory-note.dto';
import { Response } from 'express';
import { DealAnalyticsDto } from './dto/deal-analytics.dto';
import { ChecklistInstanceDto } from '../due-diligence-checklists/dtos/checklist-instance.dto';

import { SearchQueryDto } from '../common/dtos/search.dto';

@ApiTags('Deal Processing')
@Controller('deal-processing')
export class DealProcessingController {
  private readonly logger = new Logger(DealProcessingController.name);
  constructor(private readonly dealProcessingService: DealProcessingService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get deal processing analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns analytics about deal processing statuses',
    type: DealAnalyticsDto
  })
  async getDealAnalytics(): Promise<DealAnalyticsDto> {
    return this.dealProcessingService.getDealAnalytics();
  }

  @Get()
  @ApiOperation({ summary: 'Get all deal processing records with search, pagination and ordering' })
  @ApiQuery({ name: 'queryTerm', required: false, description: 'Search term for Status, Account Name or Deal Reference' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Field to order by' })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Sort direction (asc or desc)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated deal processing records with search results',
    type: DealProcessingSearchResultsDto
  })
  async getDealProcessingList(
    @Query() searchParams: SearchQueryDto
  ): Promise<DealProcessingSearchResultsDto> {
    const results = await this.dealProcessingService.getDealProcessingList(searchParams);
    this.logger.debug({results});
    return plainToInstance(DealProcessingSearchResultsDto, results, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal processing by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the deal processing record',
    type: DealProcessingResponseDto
  })
  async getDealProcessing(
    @Param('id') id: string,
  ): Promise<DealProcessingResponseDto> {
    return await this.dealProcessingService.getDealProcessing(id);

  }

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
    return await this.dealProcessingService.createDealProcessing(createDto);

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
    this.logger.debug({ body });
    const dealProcessing =
      await this.dealProcessingService.updateFundingDecision(
        id,
        body.decision,
        body.note,
        body.user ? body.user : 'unknown',
      );
    return plainToInstance(DealProcessingResponseDto, dealProcessing, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/promissory-note')
  @ApiOperation({
    summary: 'Update promissory note details',
    description:
      'Creates or updates the promissory note details for a deal processing record',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the deal processing record',
    type: String,
  })
  @ApiBody({
    type: UpdatePromissoryNoteDto,
    description: 'The promissory note details to update',
  })
  @ApiResponse({
    status: 200,
    description: 'The promissory note details have been successfully updated',
    type: DealProcessingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal processing record not found',
  })
  async updatePromissoryNote(
    @Param('id') id: string,
    @Body() updateDto: UpdatePromissoryNoteDto,
  ): Promise<DealProcessingResponseDto> {
    this.logger.debug({ id, updateDto });
    const result = await this.dealProcessingService.updatePromissoryNote(
      id,
      updateDto,
    );
    this.logger.debug('Before transformation:', { result });
    const transformed = plainToInstance(DealProcessingResponseDto, result, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
    this.logger.debug('After transformation:', { transformed });
    return transformed;
  }

  @Patch(':id/promissory-note/issue')
  @ApiOperation({
    description: 'Issues the saved promissory note for an approved deal',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the deal processing record',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The promissory note has been issued',
    type: DealProcessingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Deal processing record not found',
  })
  async issuePromissoryNote(
    @Param('id') id: string,
  ): Promise<DealProcessingResponseDto> {
    this.logger.debug({dealId: id})
    const result = await this.dealProcessingService.issuePromissoryNote(id);
    return plainToInstance(DealProcessingResponseDto, result, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  @Get(':id/promissory-note/download')
  @ApiOperation({ summary: 'Download issued promissory note PDF' })
  @ApiResponse({ status: 200, description: 'Returns the promissory note PDF file' })
  @ApiResponse({ status: 404, description: 'Deal processing or promissory note not found' })
  async downloadPromissoryNote(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const dealProcessing = await this.dealProcessingService.getDealProcessing(id);
      
      if (!dealProcessing?.promissoryNote?.issuedFile) {
        throw new NotFoundException('Issued promissory note not found');
      }

      const {  originalFileName, mimeType, storedFileName } = dealProcessing.promissoryNote.issuedFile;
      
      // Get the file buffer from storage
      const fileBuffer = await this.dealProcessingService.downloadPromissoryNoteFile(storedFileName);

      // Set response headers
      res.set({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${originalFileName}"`,
        'Content-Length': fileBuffer.length,
      });

      // Send the file
      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to download promissory note');
    }
  }

  @Patch(':id/checklist')
  @ApiOperation({ summary: 'Update a due diligence checklist for the deal' })
  @ApiParam({
    name: 'id',
    description: 'ID of the checklist to update',
    type: 'string',
  })
  @ApiBody({
    type: [ChecklistItemUpdateDto],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Checklist items updated successfully',
    type: ChecklistInstanceDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Deal processing record or checklist item not found',
  })
  async updateChecklist (
    @Param('id') id: string,
    @Body() updates: ChecklistItemUpdateDto[],
  ): Promise<ChecklistInstanceDto> {
    return await this.dealProcessingService.updateChecklist(
      id,
      updates,
    );
  }
}
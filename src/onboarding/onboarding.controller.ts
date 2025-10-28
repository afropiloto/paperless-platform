import { Body, Controller, Get, HttpStatus, Logger, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateOnboardingProcessingDto } from './dtos/create-onboarding-processing.dto';
import {
  OnboardingProcessingResponseDto,
  OnboardingProcessingSearchResultsDto,
} from './dtos/onboarding-processing-response.dto';
import { OnboardingAnalyticsDto } from './dtos/analytics.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { UpdateOnboardingDecisionDto } from './dtos/update-onboarding-decision.dto';
import { JwtGuard } from 'src/auth/guards/jwt-guard';
import { ApiKeyGuard } from 'src/api-key-auth/api-key.guard';
import { ClientAccess } from 'src/api-key-auth/decorators/client-access.decorator';
import { ClientAccessGroup } from 'src/api-key-auth/types/api-key-auth.types';

@Controller('onboarding')
@UseGuards(JwtGuard, ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The Client Application API Key',
  example: '47f19331:86382a9cbeaa603325628d29859b10fa6df94385ef792ea340cb1208ab9fdb6e'
})
@ClientAccess(ClientAccessGroup.PAPERLESS_PORTAL)
@ApiBearerAuth()
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new onboarding processing record' })
  @ApiBody({ type: CreateOnboardingProcessingDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The deal processing record has been successfully created.',
    type: OnboardingProcessingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No due diligence checklist or registration not found.',
  })
  async createDealProcessing(
    @Body() createDto: CreateOnboardingProcessingDto,
  ): Promise<OnboardingProcessingResponseDto> {
    return await this.onboardingService.createOnboardingProcessing(createDto);

  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get onboarding processing analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns analytics about onboarding processing statuses',
    type: OnboardingAnalyticsDto
  })
  async getDealAnalytics(): Promise<OnboardingAnalyticsDto> {
    return this.onboardingService.getAnalytics();
  }

  @Get()
  @ApiOperation({ summary: 'Get all onboarding processing records with search, pagination and ordering' })
  @ApiQuery({ name: 'queryTerm', required: false, description: 'Search term for Status or Company Name' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Field to order by' })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Sort direction (asc or desc)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated onboarding processing records with search results',
    type: OnboardingProcessingSearchResultsDto
  })
  async getOnboardingProcessingList(
    @Query() searchParams: SearchQueryDto
  ): Promise<OnboardingProcessingSearchResultsDto> {
    return await this.onboardingService.getDealProcessingList(searchParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal processing by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the deal processing record',
    type: OnboardingProcessingResponseDto
  })
  async getOnboardingProcessing(
    @Param('id') id: string,
  ): Promise<OnboardingProcessingResponseDto> {
    return await this.onboardingService.getOnboardingProcessing(id);
  }

  @Post(':id/decision')
  @ApiOperation({ summary: 'Update decision for an onboarding' })
  @ApiParam({
    name: 'id',
    description: 'ID of the onboarding processing record',
    type: 'string',
  })
  @ApiBody({type: UpdateOnboardingDecisionDto})
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Onboarding decision updated successfully',
    type: OnboardingProcessingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Onboarding processing record not found',
  })
  async updateOnboardingDecision(
    @Param('id') id: string,
    @Body() body: UpdateOnboardingDecisionDto,
  ): Promise<OnboardingProcessingResponseDto> {

    return this.onboardingService.updateOnboardingDecision(
        id,
        body.decision,
        body.note,
        body.user ? body.user : 'unknown',
      );

  }
}

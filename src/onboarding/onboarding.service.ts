import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CreateOnboardingProcessingDto,
  NewOnboardingRequestDto,
} from './dtos/create-onboarding-processing.dto';
import { OnboardingRepository } from './onboarding.repository';
import { RegistrationService } from '../registration/registration.service';
import { DueDiligenceChecklistType } from '../due-diligence-checklists/types/due-diligence-checklists.types';
import { DueDiligenceChecklistsService } from '../due-diligence-checklists/due-diligence-checklists.service';
import { OnboardingDecision, OnboardingStatus } from './types/onboarding.types';
import {
  OnboardingProcessingResponseDto,
  OnboardingProcessingSearchResultsDto,
} from './dtos/onboarding-processing-response.dto';
import { SearchQueryDto } from '../common/dtos/search.dto';
import { DealAnalyticsDto } from '../deal-desk/dto/deal-analytics.dto';
import { plainToInstance } from 'class-transformer';
import { ChecklistItemUpdateDto } from '../due-diligence-checklists/dtos/update-checklist.dto';
import { ChecklistInstanceDto } from '../due-diligence-checklists/dtos/checklist-instance.dto';
import { OnboardingAnalyticsDto } from './dtos/analytics.dto';

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly registrationService: RegistrationService,
    private dueDiligenceChecklistsService: DueDiligenceChecklistsService,
  ) {}

  async createOnboardingProcessing(createDto: CreateOnboardingProcessingDto) {
    // Check the registration exists
    const registration = await this.registrationService.getRegistrationDetails(
      createDto.registrationId,
    );
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Create a new Due Diligence Checklist instance
    const checklistInstance =
      await this.dueDiligenceChecklistsService.createChecklistInstance(
        DueDiligenceChecklistType.ONBOARDING,
      );
    const newOnboarding: NewOnboardingRequestDto = {
      registrationId: createDto.registrationId,
      status: OnboardingStatus.NEW,
      onboardingDecision: { decision: OnboardingDecision.PENDING },
      dueDiligenceChecklistId: checklistInstance._id,
    };
    return await this.onboardingRepository.create(newOnboarding);
  }

  async getOnboardingProcessing(
    id: string,
  ): Promise<OnboardingProcessingResponseDto> {
    try {
      const onboardingProcessing = await this.onboardingRepository.findById(id);
      onboardingProcessing.dueDiligenceChecks =
        await this.dueDiligenceChecklistsService.getChecklistInstance(
          onboardingProcessing.dueDiligenceChecklistId,
        );
      return onboardingProcessing;
    } catch (error) {
      this.logger.error(
        `Failed to get deal processing ${id}: ${error.message}`,
      );
      throw error;
    }
  }
  async getDealProcessingList(
    searchParams?: SearchQueryDto,
  ): Promise<OnboardingProcessingSearchResultsDto> {
    try {
      return await this.onboardingRepository.findAll(searchParams);
    } catch (error) {
      this.logger.error('Failed to get deal processing list:', error.message);
      throw error;
    }
  }

  async updateFundingDecision(
    id: string,
    decision: OnboardingDecision,
    note: string,
    user: string,
  ): Promise<OnboardingProcessingResponseDto> {
    this.logger.debug({ decision, note, user });
    try {
      return await this.onboardingRepository.updateOnboardingDecision(
        id,
        decision,
        note,
        user,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update funding decision for deal ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async getAnalytics(): Promise<OnboardingAnalyticsDto> {
    try {
      return await this.onboardingRepository.getAnalytics();
    } catch (error) {
      this.logger.error(`Failed to get deal analytics: ${error.message}`);
      throw error;
    }
  }

  async updateChecklist(
    id: string,
    updates: ChecklistItemUpdateDto[],
  ): Promise<ChecklistInstanceDto> {
    try {
      const dealProcessing = await this.onboardingRepository.findById(id);
      if (!dealProcessing) {
        throw new NotFoundException('Deal Processing details not found');
      }
      return await this.dueDiligenceChecklistsService.updateChecklistInstance(
        dealProcessing.dueDiligenceChecklistId,
        updates,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get update Deal Checklist: ${error.message}`,
      );
      throw error;
    }
  }
}

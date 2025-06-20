import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OnboardingDecision, OnboardingStatus } from '../types/onboarding.types';

export class CreateOnboardingProcessingDto {
  @ApiProperty({
    description: 'The ID of the registration being processed',
    example: 'eaff2842-d5de-4439-9754-56b3bdbebf75',
  })
  @IsNotEmpty()
  registrationId: string;
}

export interface NewOnboardingRequestDto {
  registrationId: string;
  status: OnboardingStatus,
  dueDiligenceChecklistId: string
  onboardingDecision: {
    decision: OnboardingDecision;
  },
}
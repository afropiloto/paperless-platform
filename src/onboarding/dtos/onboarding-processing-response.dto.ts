import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ChecklistInstanceDto } from 'src/due-diligence-checklists/dtos/checklist-instance.dto';
import { SearchResultsMetadata } from 'src/common/dtos/search.dto';

import { NoteResponseDto } from 'src/common/dto/note-response.dto';
import { OnboardingDecision, OnboardingStatus } from '../types/onboarding.types';

export enum PromissoryNoteState {
  IN_PROGRESS="IN_PROGRESS",
  ISSUED="ISSUED",
  SIGNED="SIGNED"
}

@Exclude()
export class OnboardingDecisionResponseDto {
  @ApiProperty({
    description: 'The onboarding decision',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    example: 'APPROVED'
  })
  @Expose()
  decision: OnboardingDecision;

  @ApiProperty({
    description: 'Notes about the funding decision',
    type: NoteResponseDto
  })
  @Expose()
  @Type(() => NoteResponseDto)
  decisionNotes: NoteResponseDto;

  @ApiProperty({
    description: 'Decision Date',
    type: Date
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;
}


@Exclude()
export class OnboardingProcessingResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the onboarding processing record',
    example: '507f1f77bcf86cd799439011'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  _id: string;

  @ApiProperty({
    description: 'Reference to the registration details',
    example: '507f1f77bcf86cd799439012'
  })
  @Expose()
  @Transform(({ value }) => value?.toString(), { toPlainOnly: true })
  registrationId: string;


  @ApiProperty({
    description: 'Current status of the deal processing',
    enum: ['New', 'In Progress', 'Awaiting Decision', 'Approved', 'Rejected'],
    example: 'In Progress'
  })
  @Expose()
  @IsEnum(OnboardingStatus)
  status: OnboardingStatus;


  @ApiProperty({
    description: 'Due Diligence Checklist ID associated with the onboarding',
    example: '507f1f77bcf86cd799439012'
  })
  @Expose()
  @IsString()
  dueDiligenceChecklistId: string;

  @ApiProperty({
    description: 'Due Diligence Checklist associated with the onboarding processing',
    example: '507f1f77bcf86cd799439012'
  })
  @Expose()
  @Type(() => ChecklistInstanceDto)
  dueDiligenceChecks?: ChecklistInstanceDto;


  @ApiProperty({
    description: 'Onboarding decision information',
    type: OnboardingDecisionResponseDto
  })
  @Expose()
  @Type(() => OnboardingDecisionResponseDto)
  onboardingDecision: OnboardingDecisionResponseDto;


  @ApiProperty({
    description: 'When the record was created',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'When the record was last updated',
    example: '2024-03-20T10:00:00Z'
  })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Name of the company',
    example: "TechCorp Solutions Ltd"
  })
  @Expose()
  companyName: string;
}


@Exclude()
export class OnboardingProcessingSearchResultsDto {
  @ApiProperty({description: "List of matching Onboarding records"})
  @Expose()
  @Type(() => OnboardingProcessingResponseDto)
  data?: OnboardingProcessingResponseDto[];

  @ApiProperty({description: "Search Results Metadata"})
  @Expose()
  @Type(() => SearchResultsMetadata)
  metadata?: SearchResultsMetadata;
}
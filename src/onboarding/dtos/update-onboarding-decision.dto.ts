import { Prop } from '@nestjs/mongoose';
import { OnboardingDecision } from '../types/onboarding.types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class UpdateOnboardingDecisionDto {
  @ApiProperty({description: "The decision status to capture", example: "APPROVED", enum: OnboardingDecision})
  @Prop()
  @IsEnum(OnboardingDecision)
  decision: OnboardingDecision;

  @ApiProperty({description: "Note text for the decision", example:"All checks satisfactory", type: "string"})
  @Prop()
  @IsString()
  note: string;

  @ApiProperty({description: "User making the decision", example:"bob123", type: "string"})
  @Prop()
  @IsString()
  @IsOptional()
  user?: string;

}
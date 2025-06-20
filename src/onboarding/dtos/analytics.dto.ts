import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class OnboardingAnalyticsDto {
  @ApiProperty({description: "The total number of New Onboarding tickets", example: "12"})
  @Expose()
  totalNew: number;

  @ApiProperty({description: "The total number of In Progress Onboarding tickets", example: "12"})
  @Expose()
  totalInProgress: number;

}
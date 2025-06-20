import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingProcessing, OnboardingProcessingSchema } from './schemas/onboarding.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingRepository } from './onboarding.repository';
import { DueDiligenceChecklistsModule } from '../due-diligence-checklists/due-diligence-checklists.module';
import { RegistrationModule } from '../registration/registration.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OnboardingProcessing.name, schema: OnboardingProcessingSchema },
    ]),
    DueDiligenceChecklistsModule,
    RegistrationModule,
  ],
  providers: [OnboardingService, OnboardingRepository],
  controllers: [OnboardingController]
})
export class OnboardingModule {}

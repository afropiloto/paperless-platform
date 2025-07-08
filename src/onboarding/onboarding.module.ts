import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingProcessing, OnboardingProcessingSchema } from './schemas/onboarding.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingRepository } from './onboarding.repository';
import { DueDiligenceChecklistsModule } from '../due-diligence-checklists/due-diligence-checklists.module';
import { RegistrationModule } from '../registration/registration.module';
import { BullModule } from '@nestjs/bullmq';
import { AccountsQueue } from '../constants/app.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OnboardingProcessing.name, schema: OnboardingProcessingSchema },
    ]),
    BullModule.registerQueue({name: AccountsQueue.NEW_ACCOUNT_QUEUE}),
    DueDiligenceChecklistsModule,
    RegistrationModule,
  ],
  providers: [OnboardingService, OnboardingRepository],
  controllers: [OnboardingController],
  exports: [OnboardingService]
})
export class OnboardingModule {}

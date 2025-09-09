import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingProcessing, OnboardingProcessingSchema } from './schemas/onboarding.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingRepository } from './onboarding.repository';
import { DueDiligenceChecklistsModule } from '../due-diligence-checklists/due-diligence-checklists.module';
import { RegistrationModule } from '../registration/registration.module';
import { OnboardingChecksModule } from '../onboarding-checks/onboarding-checks.module';
import { BullModule } from '@nestjs/bullmq';
import { AccountsQueue } from '../constants/app.constants';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: OnboardingProcessing.name, schema: OnboardingProcessingSchema },
    ]),
    BullModule.registerQueue({name: AccountsQueue.NEW_ACCOUNT_QUEUE}),
    DueDiligenceChecklistsModule,
    RegistrationModule,
    OnboardingChecksModule,
    JwtConfigModule,
    ApiKeyAuthModule,
  ],
  providers: [OnboardingService, OnboardingRepository],
  controllers: [OnboardingController],
  exports: [OnboardingService]
})
export class OnboardingModule {}

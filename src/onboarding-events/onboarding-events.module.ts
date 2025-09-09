import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { OnboardingChecksModule } from '../onboarding-checks/onboarding-checks.module';
import { RegistrationModule } from '../registration/registration.module';
import { BullModule } from '@nestjs/bullmq';
import { OnboardingQueues } from '../constants/app.constants';
import { NewOnboardingQueueProcessor } from './new-onboarding-event.processor';


@Module({
  imports: [
    BullModule.registerQueue({name: OnboardingQueues.NEW_ONBOARDING_REQUESTS}),
    AuditModule,
    OnboardingModule,
    OnboardingChecksModule,
    RegistrationModule,
  ],
  providers: [NewOnboardingQueueProcessor]
})
export class OnboardingEventsModule {}

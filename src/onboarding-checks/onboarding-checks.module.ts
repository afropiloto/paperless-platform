import { Module } from '@nestjs/common';
import { OnboardingChecksService } from './onboarding-checks.service';
import { DueDiligenceChecklistsModule } from '../due-diligence-checklists/due-diligence-checklists.module';
import { RegistrationModule } from '../registration/registration.module';
import { AccountsModule } from '../accounts/accounts.module';
import { OnboardingChecksRouter } from './processors/onboarding-checks-router.processor';
import { DuplicateRegistrationCheckService } from './services/duplicate-registration-check.service';
import { EmailUniquenessCheckService } from './services/email-uniqueness-check.service';
import { WalletUniquenessCheckService } from './services/wallet-uniqueness-check.service';
import { BullModule } from '@nestjs/bullmq';
import { OnboardingQueues } from '../constants/app.constants';
import { ConfigurationService } from '../config/configuration.service';
import { ProcessorConfigService } from '../config/processor-config.service';

@Module({
  imports: [
    DueDiligenceChecklistsModule,
    RegistrationModule,
    AccountsModule,
    BullModule.registerQueue({
      name: OnboardingQueues.ONBOARDING_CHECKS,
    }),
  ],
  providers: [
    OnboardingChecksService,
    OnboardingChecksRouter,
    DuplicateRegistrationCheckService,
    EmailUniquenessCheckService,
    WalletUniquenessCheckService,
    ConfigurationService,
    ProcessorConfigService,
  ],
  exports: [OnboardingChecksService, ConfigurationService, ProcessorConfigService],
})
export class OnboardingChecksModule {}

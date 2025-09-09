import { Module } from '@nestjs/common';
import { OnboardingChecksService } from './onboarding-checks.service';
import { DueDiligenceChecklistsModule } from '../due-diligence-checklists/due-diligence-checklists.module';
import { RegistrationModule } from '../registration/registration.module';
import { AccountsModule } from '../accounts/accounts.module';
import { DuplicateRegistrationCheckProcessor } from './processors/duplicate-registration-check.processor';
import { EmailUniquenessCheckProcessor } from './processors/email-uniqueness-check.processor';
import { WalletUniquenessCheckProcessor } from './processors/wallet-uniqueness-check.processor';
import { BullModule } from '@nestjs/bullmq';
import { OnboardingQueues } from '../constants/app.constants';

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
    DuplicateRegistrationCheckProcessor,
    EmailUniquenessCheckProcessor,
    WalletUniquenessCheckProcessor,
  ],
  exports: [OnboardingChecksService],
})
export class OnboardingChecksModule {}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OnboardingCheckEventData } from '../types/onboarding-checks.types';
import { OnboardingChecksService } from '../onboarding-checks.service';
import { RegistrationService } from 'src/registration/registration.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { ChecklistItemStatus } from 'src/deal-desk/types/deal-desk.types';
import { OnboardingQueues } from 'src/constants/app.constants';

@Processor(OnboardingQueues.ONBOARDING_CHECKS)
export class WalletUniquenessCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(WalletUniquenessCheckProcessor.name);

  constructor(
    @Inject()
    private readonly onboardingChecksService: OnboardingChecksService,
    @Inject()
    private readonly registrationService: RegistrationService,
    @Inject()
    private readonly accountsService: AccountsService,
  ) {
    super();
  }

  async process(job: Job<OnboardingCheckEventData>): Promise<void> {
    // Only process wallet uniqueness check events
    if (job.name !== 'ONBOARDING_CHECK_WALLET_UNIQUENESS') {
      this.logger.debug(`Skipping job ${job.id} with event type ${job.name} - not a wallet uniqueness check`);
      return;
    }

    this.logger.log(`Processing wallet uniqueness check for registration ${job.data.registrationId}`);
    
    try {
      const registration = await this.registrationService.getRegistrationDetails(
        job.data.registrationId
      );

      if (!registration) {
        throw new Error('Registration not found');
      }

      const walletAddress = registration.company.accountWalletAddress;
      this.logger.debug({walletAddress})
      // Check for existing accounts with same wallet
      const existingAccount = await this.accountsService.findByWalletAddress(walletAddress);
      this.logger.debug({existingAccount})

      // Check for existing account users with same wallet
      const existingAccountUsers = await this.accountsService.findUsersByWalletAddress(walletAddress);
      this.logger.debug({existingAccountUsers})
      // Check for existing registrations with same wallet (exclude completed/rejected)
      const existingRegistrations = await this.registrationService.findByWalletAddress(
        walletAddress,
        { excludeStatuses: ['COMPLETED', 'REJECTED'] }
      );
      this.logger.debug({existingRegistrations})

      const hasDuplicates = existingAccount ||
                           existingAccountUsers.length > 0 || 
                           existingRegistrations.length > 0;

      this.logger.debug({existingAccount, existingAccountUsers:existingAccountUsers.length, existingRegistrations: existingRegistrations.length})
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        job.data.checklistInstanceId,
        job.data.sectionTitle,
        job.data.itemTitle,
        hasDuplicates ? ChecklistItemStatus.CRITICAL : ChecklistItemStatus.SATISFACTORY,
        [{
          text: hasDuplicates 
            ? `Wallet "${walletAddress}" already in use within the Platform`
            : `Wallet "${walletAddress}" is unique`,
          userId: 'system'
        }]
      );

      this.logger.log(`Wallet uniqueness check completed for registration ${job.data.registrationId}: ${hasDuplicates ? 'DUPLICATE WALLET FOUND' : 'WALLET UNIQUE'}`);
    } catch (error) {
      this.logger.error(`Error in wallet uniqueness check for registration ${job.data.registrationId}: ${error.message}`);
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        job.data.checklistInstanceId,
        job.data.sectionTitle,
        job.data.itemTitle,
        ChecklistItemStatus.CRITICAL,
        [{ text: `Error: ${error.message}`, userId: 'system' }]
      );
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { OnboardingCheckEventData } from '../types/onboarding-checks.types';
import { OnboardingChecksService } from '../onboarding-checks.service';
import { RegistrationService } from '../../registration/registration.service';
import { AccountsService } from '../../accounts/accounts.service';
import { ChecklistItemStatus } from '../../deal-desk/types/deal-desk.types';

@Injectable()
export class WalletUniquenessCheckService {
  private readonly logger = new Logger(WalletUniquenessCheckService.name);

  constructor(
    private readonly onboardingChecksService: OnboardingChecksService,
    private readonly registrationService: RegistrationService,
    private readonly accountsService: AccountsService,
  ) {}

  async executeCheck(data: OnboardingCheckEventData): Promise<void> {
    this.logger.log(`Processing wallet uniqueness check for registration ${data.registrationId}`);
    
    try {
      const registration = await this.registrationService.getRegistrationDetails(
        data.registrationId
      );

      if (!registration) {
        throw new Error('Registration not found');
      }

      const walletAddress = registration.company.accountWalletAddress;
      this.logger.debug({walletAddress});
      
      // Check for existing accounts with same wallet
      const existingAccount = await this.accountsService.findByWalletAddress(walletAddress);
      this.logger.debug({existingAccount});

      // Check for existing account users with same wallet
      const existingAccountUsers = await this.accountsService.findUsersByWalletAddress(walletAddress);
      this.logger.debug({existingAccountUsers});
      
      // Check for existing registrations with same wallet (exclude completed/rejected)
      const existingRegistrations = await this.registrationService.findByWalletAddress(
        walletAddress,
        { excludeStatuses: ['COMPLETED', 'REJECTED'] }
      );
      this.logger.debug({existingRegistrations});

      const hasDuplicates = existingAccount ||
                           existingAccountUsers.length > 0 || 
                           existingRegistrations.length > 0;

      this.logger.debug({
        existingAccount, 
        existingAccountUsers: existingAccountUsers.length, 
        existingRegistrations: existingRegistrations.length
      });
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        data.checklistInstanceId,
        data.sectionTitle,
        data.itemTitle,
        hasDuplicates ? ChecklistItemStatus.CRITICAL : ChecklistItemStatus.SATISFACTORY,
        [{
          text: hasDuplicates 
            ? `Wallet "${walletAddress}" already in use within the Platform`
            : `Wallet "${walletAddress}" is unique`,
          userId: 'system'
        }]
      );

      this.logger.log(`Wallet uniqueness check completed for registration ${data.registrationId}: ${hasDuplicates ? 'DUPLICATE WALLET FOUND' : 'WALLET UNIQUE'}`);
    } catch (error) {
      this.logger.error(`Error in wallet uniqueness check for registration ${data.registrationId}: ${error.message}`);
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        data.checklistInstanceId,
        data.sectionTitle,
        data.itemTitle,
        ChecklistItemStatus.CRITICAL,
        [{ text: `Error: ${error.message}`, userId: 'system' }]
      );
      
      throw error; // Re-throw to let the router handle retry logic
    }
  }
}

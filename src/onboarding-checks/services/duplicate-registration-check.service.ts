import { Injectable, Logger } from '@nestjs/common';
import { OnboardingCheckEventData } from '../types/onboarding-checks.types';
import { OnboardingChecksService } from '../onboarding-checks.service';
import { RegistrationService } from '../../registration/registration.service';
import { AccountsService } from '../../accounts/accounts.service';
import { ChecklistItemStatus } from '../../deal-desk/types/deal-desk.types';

@Injectable()
export class DuplicateRegistrationCheckService {
  private readonly logger = new Logger(DuplicateRegistrationCheckService.name);

  constructor(
    private readonly onboardingChecksService: OnboardingChecksService,
    private readonly registrationService: RegistrationService,
    private readonly accountsService: AccountsService,
  ) {}

  async executeCheck(data: OnboardingCheckEventData): Promise<void> {
    this.logger.log(`Processing duplicate registration check for registration ${data.registrationId}`);
    
    try {
      const registration = await this.registrationService.getRegistrationDetails(
        data.registrationId
      );

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Check for existing registrations with same company name (excluding current registration)
      const existingRegistrations = await this.registrationService.findByCompanyName(
        registration.company.name,
        { excludeStatuses: ['COMPLETED', 'REJECTED'] }
      ).then(registrations => 
        registrations.filter(reg => reg.registrationId !== registration.registrationId)
      );

      // Check for existing accounts with same company name
      const existingAccounts = await this.accountsService.findByCompanyName(
        registration.company.name
      );

      const hasDuplicates = existingRegistrations.length > 0 || existingAccounts.length > 0;
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        data.checklistInstanceId,
        data.sectionTitle,
        data.itemTitle,
        hasDuplicates ? ChecklistItemStatus.CRITICAL : ChecklistItemStatus.SATISFACTORY,
        [{
          text: hasDuplicates 
            ? `Found ${existingRegistrations.length} existing registrations and ${existingAccounts.length} existing accounts for company "${registration.company.name}"`
            : `No duplicate company registrations found for "${registration.company.name}"`,
          userId: 'system'
        }]
      );

      this.logger.log(`Duplicate registration check completed for registration ${data.registrationId}: ${hasDuplicates ? 'DUPLICATES FOUND' : 'NO DUPLICATES'}`);
    } catch (error) {
      this.logger.error(`Error in duplicate registration check for registration ${data.registrationId}: ${error.message}`);
      
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

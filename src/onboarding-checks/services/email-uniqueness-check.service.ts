import { Injectable, Logger } from '@nestjs/common';
import { OnboardingCheckEventData } from '../types/onboarding-checks.types';
import { OnboardingChecksService } from '../onboarding-checks.service';
import { RegistrationService } from '../../registration/registration.service';
import { AccountsService } from '../../accounts/accounts.service';
import { ChecklistItemStatus } from '../../deal-desk/types/deal-desk.types';

@Injectable()
export class EmailUniquenessCheckService {
  private readonly logger = new Logger(EmailUniquenessCheckService.name);

  constructor(
    private readonly onboardingChecksService: OnboardingChecksService,
    private readonly registrationService: RegistrationService,
    private readonly accountsService: AccountsService,
  ) {}

  async executeCheck(data: OnboardingCheckEventData): Promise<void> {
    this.logger.log(`Processing email uniqueness check for registration ${data.registrationId}`);
    
    try {
      const registration = await this.registrationService.getRegistrationDetails(
        data.registrationId
      );

      if (!registration) {
        throw new Error('Registration not found');
      }

      const primaryContactEmail = registration.contact.email;

      // Check for existing account contacts with same email
      const existingAccountContacts = await this.accountsService.findContactsByEmail(
        primaryContactEmail
      );

      // Check for existing account users with same email
      const existingAccountUsers = await this.accountsService.findUsersByEmail(
        primaryContactEmail
      );

      const hasDuplicates = existingAccountContacts.length > 0 || existingAccountUsers.length > 0;
      
      await this.onboardingChecksService.updateAutomatedChecklistItem(
        data.checklistInstanceId,
        data.sectionTitle,
        data.itemTitle,
        hasDuplicates ? ChecklistItemStatus.CRITICAL : ChecklistItemStatus.SATISFACTORY,
        [{
          text: hasDuplicates 
            ? `Email "${primaryContactEmail}" already exists in ${existingAccountContacts.length} account contacts and ${existingAccountUsers.length} account users`
            : `Email "${primaryContactEmail}" is unique`,
          userId: 'system'
        }]
      );

      this.logger.log(`Email uniqueness check completed for registration ${data.registrationId}: ${hasDuplicates ? 'DUPLICATE EMAIL FOUND' : 'EMAIL UNIQUE'}`);
    } catch (error) {
      this.logger.error(`Error in email uniqueness check for registration ${data.registrationId}: ${error.message}`);
      
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

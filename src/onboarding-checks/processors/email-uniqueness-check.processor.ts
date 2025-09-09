import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OnboardingCheckEventData } from '../types/onboarding-checks.types';
import { OnboardingChecksService } from '../onboarding-checks.service';
import { RegistrationService } from '../../registration/registration.service';
import { AccountsService } from '../../accounts/accounts.service';
import { ChecklistItemStatus } from '../../deal-desk/types/deal-desk.types';
import { OnboardingQueues } from '../../constants/app.constants';

@Processor(OnboardingQueues.ONBOARDING_CHECKS)
export class EmailUniquenessCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailUniquenessCheckProcessor.name);

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
    // Only process email uniqueness check events
    if (job.name !== 'ONBOARDING_CHECK_EMAIL_UNIQUENESS') {
      this.logger.debug(`Skipping job ${job.id} with event type ${job.name} - not an email uniqueness check`);
      return;
    }

    this.logger.log(`Processing email uniqueness check for registration ${job.data.registrationId}`);
    
    try {
      const registration = await this.registrationService.getRegistrationDetails(
        job.data.registrationId
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
        job.data.checklistInstanceId,
        job.data.sectionTitle,
        job.data.itemTitle,
        hasDuplicates ? ChecklistItemStatus.CRITICAL : ChecklistItemStatus.SATISFACTORY,
        [{
          text: hasDuplicates 
            ? `Email "${primaryContactEmail}" already exists in ${existingAccountContacts.length} account contacts and ${existingAccountUsers.length} account users`
            : `Email "${primaryContactEmail}" is unique`,
          userId: 'system'
        }]
      );

      this.logger.log(`Email uniqueness check completed for registration ${job.data.registrationId}: ${hasDuplicates ? 'DUPLICATE EMAIL FOUND' : 'EMAIL UNIQUE'}`);
    } catch (error) {
      this.logger.error(`Error in email uniqueness check for registration ${job.data.registrationId}: ${error.message}`);
      
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

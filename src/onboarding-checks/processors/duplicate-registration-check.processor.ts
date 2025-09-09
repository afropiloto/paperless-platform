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
export class DuplicateRegistrationCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(DuplicateRegistrationCheckProcessor.name);

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
    // Only process duplicate registration check events
    if (job.name !== 'ONBOARDING_CHECK_DUPLICATE_REGISTRATION') {
      this.logger.debug(`Skipping job ${job.id} with event type ${job.name} - not a duplicate registration check`);
      return;
    }

    this.logger.log(`Processing duplicate registration check for registration ${job.data.registrationId}`);
    
    try {
      const registration = await this.registrationService.getRegistrationDetails(
        job.data.registrationId
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
        job.data.checklistInstanceId,
        job.data.sectionTitle,
        job.data.itemTitle,
        hasDuplicates ? ChecklistItemStatus.CRITICAL : ChecklistItemStatus.SATISFACTORY,
        [{
          text: hasDuplicates 
            ? `Found ${existingRegistrations.length} existing registrations and ${existingAccounts.length} existing accounts for company "${registration.company.name}"`
            : `No duplicate company registrations found for "${registration.company.name}"`,
          userId: 'system'
        }]
      );

      this.logger.log(`Duplicate registration check completed for registration ${job.data.registrationId}: ${hasDuplicates ? 'DUPLICATES FOUND' : 'NO DUPLICATES'}`);
    } catch (error) {
      this.logger.error(`Error in duplicate registration check for registration ${job.data.registrationId}: ${error.message}`);
      
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

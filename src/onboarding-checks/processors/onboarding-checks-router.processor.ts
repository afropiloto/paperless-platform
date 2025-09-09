import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { OnboardingCheckEventData } from '../types/onboarding-checks.types';
import { OnboardingQueues } from '../../constants/app.constants';
import { DuplicateRegistrationCheckService } from '../services/duplicate-registration-check.service';
import { EmailUniquenessCheckService } from '../services/email-uniqueness-check.service';
import { WalletUniquenessCheckService } from '../services/wallet-uniqueness-check.service';

@Processor(OnboardingQueues.ONBOARDING_CHECKS, {
  concurrency: parseInt(process.env.ONBOARDING_CHECKS_CONCURRENCY || '5'),
})
export class OnboardingChecksRouter extends WorkerHost {
  private readonly logger = new Logger(OnboardingChecksRouter.name);

  constructor(
    private readonly duplicateRegistrationCheckService: DuplicateRegistrationCheckService,
    private readonly emailUniquenessCheckService: EmailUniquenessCheckService,
    private readonly walletUniquenessCheckService: WalletUniquenessCheckService,
  ) {
    super();
  }

  async process(job: Job<OnboardingCheckEventData>): Promise<void> {
    this.logger.log(`Processing onboarding check job ${job.id} with event type: ${job.name}`);
    
    try {
      // Route job to appropriate handler based on job name
      switch (job.name) {
        case 'ONBOARDING_CHECK_DUPLICATE_REGISTRATION':
          await this.duplicateRegistrationCheckService.executeCheck(job.data);
          break;
          
        case 'ONBOARDING_CHECK_EMAIL_UNIQUENESS':
          await this.emailUniquenessCheckService.executeCheck(job.data);
          break;
          
        case 'ONBOARDING_CHECK_WALLET_UNIQUENESS':
          await this.walletUniquenessCheckService.executeCheck(job.data);
          break;
          
        default:
          const errorMessage = `Unknown onboarding check event type: ${job.name}`;
          this.logger.error(errorMessage);
          throw new Error(errorMessage);
      }
      
      this.logger.log(`Successfully processed onboarding check job ${job.id} for event type: ${job.name}`);
    } catch (error) {
      this.logger.error(`Failed to process onboarding check job ${job.id} for event type ${job.name}: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      
      // Re-throw the error to let BullMQ handle retry logic
      throw error;
    }
  }
}

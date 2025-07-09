import { OnboardingQueues } from '../constants/app.constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RegistrationService } from '../registration/registration.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { Job } from 'bullmq';
import { Promise } from 'mongoose';
import { OnboardingJobData } from './onboarding-events.types';
import { CreateOnboardingProcessingDto } from '../onboarding/dtos/create-onboarding-processing.dto';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';

@Processor(OnboardingQueues.NEW_ONBOARDING_REQUESTS)
export class NewOnboardingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NewOnboardingQueueProcessor.name);

  constructor(
    @Inject()
    private readonly auditService: AuditService,
    @Inject()
    private readonly registrationService: RegistrationService,
    @Inject()
    private readonly onboardingService: OnboardingService,
  ) {super()}

  async process(job: Job<OnboardingJobData>): Promise<void> {
    this.logger.log({message: `Picking up job ${job.id} for event ${job.name}`, jobData: job.data })

    const existingOnboarding = await this.onboardingService.getOnboardingProcessingByRegistrationId(job.data.registrationId);
    if (existingOnboarding) {throw new Error (`An Onboarding record already exists for registration id ${job.data.registrationId}`)}

    const registrationDetails = await this.registrationService.getRegistrationDetails(
      job.data.registrationId,
    );

    if (!registrationDetails) {
      throw new Error('Registration Details not found');
    }

    const createOnboardingDetails: CreateOnboardingProcessingDto = {
      registrationId: job.data.registrationId,
    };
    const onboardingRecord =
      await this.onboardingService.createOnboardingProcessing(
        createOnboardingDetails,
      );

    await this.auditService.log({
      subject: AuditSubject.ONBOARDING,
      eventType: AuditEventType.CREATED,
      identifier: onboardingRecord._id,
      details: {registrationId: registrationDetails.registrationId, onboardingId: onboardingRecord._id},
    });
  }
}
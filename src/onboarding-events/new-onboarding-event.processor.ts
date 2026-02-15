import { OnboardingQueues } from '../constants/app.constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { RegistrationService } from '../registration/registration.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { OnboardingChecksService } from '../onboarding-checks/onboarding-checks.service';
import { Job } from 'bullmq';
import { OnboardingJobData } from './onboarding-events.types';
import { CreateOnboardingProcessingDto, NewOnboardingRequestDto } from '../onboarding/dtos/create-onboarding-processing.dto';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';

@Processor(OnboardingQueues.NEW_ONBOARDING_REQUESTS)
export class NewOnboardingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NewOnboardingQueueProcessor.name);

  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(RegistrationService)
    private readonly registrationService: RegistrationService,
    @Inject(OnboardingService)
    private readonly onboardingService: OnboardingService,
    @Inject(OnboardingChecksService)
    private readonly onboardingChecksService: OnboardingChecksService,
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
    // Create onboarding checks checklist instance
    const checklistInstanceId = await this.onboardingChecksService.createChecklistInstance();

    // Update onboarding record with checklist ID
    await this.onboardingService.updateOnboardingProcessing(
      onboardingRecord._id,
      { onboardingChecksChecklistId: checklistInstanceId } as Partial<NewOnboardingRequestDto>
    );

    // Get checklist template and queue automated checks
    const checklistTemplate = await this.onboardingChecksService.getChecklistTemplate();
    await this.onboardingChecksService.queueAutomatedChecks(
      checklistTemplate,
      {
        checklistInstanceId,
        registrationId: job.data.registrationId,
        onboardingProcessingId: onboardingRecord._id
      }
    );

    await this.auditService.log({
      subject: AuditSubject.ONBOARDING,
      eventType: AuditEventType.CREATED,
      identifier: onboardingRecord._id,
      details: {
        registrationId: registrationDetails.registrationId, 
        onboardingId: onboardingRecord._id,
        checklistInstanceId
      },
    });
  }
}
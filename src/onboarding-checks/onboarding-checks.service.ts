import { Injectable, Logger } from '@nestjs/common';
import { DueDiligenceChecklistsService } from '../due-diligence-checklists/due-diligence-checklists.service';
import { DueDiligenceChecklistType, ChecklistUpdateOriginator, CheckType } from '../due-diligence-checklists/types/due-diligence-checklists.types';
import { ChecklistItemStatus } from '../deal-desk/types/deal-desk.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OnboardingQueues } from '../constants/app.constants';

@Injectable()
export class OnboardingChecksService {
  private readonly logger = new Logger(OnboardingChecksService.name);

  constructor(
    private readonly checklistService: DueDiligenceChecklistsService,
    @InjectQueue(OnboardingQueues.ONBOARDING_CHECKS)
    private readonly checksQueue: Queue,
  ) {}

  async createChecklistInstance(): Promise<string> {
    try {
      const checklistInstance = await this.checklistService.createChecklistInstance(
        DueDiligenceChecklistType.ONBOARDING
      );
      return checklistInstance._id.toString();
    } catch (error) {
      this.logger.error(`Failed to create checklist instance: ${error.message}`);
      throw error;
    }
  }

  async getChecklistTemplate() {
    return await this.checklistService.getLatestChecklist(
      DueDiligenceChecklistType.ONBOARDING
    );
  }

  async updateAutomatedChecklistItem(
    checklistId: string,
    sectionTitle: string,
    itemTitle: string,
    status: ChecklistItemStatus,
    notes?: { text: string; userId: string }[]
  ) {
    const updates = [{
      sectionTitle,
      itemTitle,
      status,
      notes,
      originator: ChecklistUpdateOriginator.AUTOMATED
    }];

    return await this.checklistService.updateChecklistInstance(
      checklistId,
      updates,
      ChecklistUpdateOriginator.AUTOMATED
    );
  }

  async queueAutomatedChecks(
    checklistTemplate: any,
    eventData: {
      checklistInstanceId: string;
      registrationId: string;
      onboardingProcessingId: string;
    }
  ) {
    try {
      for (const section of checklistTemplate.sections) {
        for (const item of section.items) {
          if (item.checkType === CheckType.AUTOMATED && item.eventType) {
            await this.checksQueue.add(
              item.eventType,
              {
                ...eventData,
                sectionTitle: section.title,
                itemTitle: item.title,
                checkConfig: item.checkConfig
              },
              {
                attempts: item.checkConfig?.retryAttempts || 3,
                backoff: {
                  type: 'exponential',
                  delay: 2000,
                },
              }
            );
            
            this.logger.log(`Queued check: ${item.eventType} for registration ${eventData.registrationId} (${section.title} - ${item.title})`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to queue automated checks: ${error.message}`);
      throw error;
    }
  }
}

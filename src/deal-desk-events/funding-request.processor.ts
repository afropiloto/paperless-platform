import { Processor, WorkerHost } from '@nestjs/bullmq';
import { DealDeskEvents, DealDeskQueues } from '../constants/app.constants';
import { Job } from 'bullmq';
import { FundingRequestJobData } from '../deal-desk/types/deal-desk-event.types';
import { Inject, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { DealProcessingService } from '../deal-desk/deal-processing.service';
import { AuditEventType } from '../audit/audit-event-type.enum';

@Processor(DealDeskQueues.CUSTOMER_FUNDING_REQUESTS)
export class FundingRequestProcessor extends WorkerHost {
  private readonly logger = new Logger(FundingRequestProcessor.name);
  constructor(
    @Inject()
    private readonly auditService: AuditService,
    @Inject()
    private readonly dealProcessingService: DealProcessingService,
  ) {
    super();
  }

  private async handleNewFundingRequest(
    job: Job<FundingRequestJobData>,
  ): Promise<void> {
    const { accountId, dealId } = job.data;
    try {
      const dealProcessing = await this.dealProcessingService.getDealProcessingByDealId(accountId, dealId);

      if (dealProcessing) {
        throw new Error(`Deal Processing already created for accountId :'${accountId}' and dealId: '${dealId}`);
      }

      const newDealProcessing = await this.dealProcessingService.createDealProcessing({
        accountId,
        dealId,
      });

      await this.auditService.log({ eventType: AuditEventType.FUNDING_REQUESTED, accountId, details: { dealId, dealProcessingId: newDealProcessing._id} });
    } catch (error) {
      this.logger.error({ message: `Processing failed for job ${job.id} for event ${job.name}`, data: job.data, error });
      throw error;
    }
  }

  private async handleWithdrawFundingRequest(
    job: Job<FundingRequestJobData>,
  ): Promise<void> {
    const { accountId, dealId } = job.data;

    const dealprocessing = this.dealProcessingService.getDealProcessingByDealId(accountId, dealId);
    if (!dealprocessing) {throw new Error(`Deal Processing does not exist for accountId :'${accountId}' and dealId: '${dealId}`);}

    await this.dealProcessingService.deleteDealProcessing(
      accountId,
      dealId,
    );

    await this.auditService.log({ eventType: AuditEventType.FUNDING_WITHDRAWN,accountId, details: {dealId}  });
  }

  async process(job: Job<FundingRequestJobData>): Promise<void> {
    switch (job.name) {
      case DealDeskEvents.NEW_FUNDING_REQUEST:
        return await this.handleNewFundingRequest(job);
      case DealDeskEvents.WITHDRAW_FUNDING_REQUEST:
        return await this.handleWithdrawFundingRequest(job);
      default:
        this.logger.warn({
          message: 'Unknown Deal Desk Event',
          eventName: job.name,
        });
        return;
    }
  }
}
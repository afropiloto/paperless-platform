import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DvpSettlementEvent, DvpSettlementQueues } from '../constants/app.constants';
import { DvpCoordinatorService } from '../mletr-dvp/services/dvp-coordinator.service';

export interface DvpSettlementJobData {
  accountId: string;
  settlementId: string;
  paymentTxHash?: string;
}

@Processor(DvpSettlementQueues.SETTLEMENT_QUEUE)
export class DvpSettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(DvpSettlementProcessor.name);

  constructor(
    @Inject(DvpCoordinatorService)
    private readonly coordinatorService: DvpCoordinatorService,
  ) {
    super();
  }

  async process(job: Job<DvpSettlementJobData>): Promise<void> {
    const { accountId, settlementId, paymentTxHash } = job.data;

    try {
      switch (job.name) {
        case DvpSettlementEvent.AGENT_REVIEW:
          await this.coordinatorService.runAgentReview(accountId, settlementId);
          break;

        case DvpSettlementEvent.MONITOR_PAYMENT:
          if (paymentTxHash) {
            await this.coordinatorService.confirmPayment(
              accountId,
              settlementId,
              paymentTxHash,
            );
          }
          break;

        case DvpSettlementEvent.EXECUTE_DOCUMENT_TRANSFER:
          await this.coordinatorService.executeDocumentTransfer(accountId, settlementId);
          await this.coordinatorService.releasePayment(accountId, settlementId);
          await this.coordinatorService.completeSettlement(accountId, settlementId);
          break;

        case DvpSettlementEvent.COMPLETE_SETTLEMENT:
          await this.coordinatorService.executeDocumentTransfer(accountId, settlementId);
          await this.coordinatorService.releasePayment(accountId, settlementId);
          await this.coordinatorService.completeSettlement(accountId, settlementId);
          break;

        default:
          this.logger.warn({ message: 'Unknown DvP settlement event', eventName: job.name });
      }
    } catch (error) {
      this.logger.error({
        message: `DvP settlement job failed: ${job.name}`,
        settlementId,
        error: error.message,
      });
      throw error;
    }
  }
}

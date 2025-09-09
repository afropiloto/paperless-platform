import { Injectable } from '@nestjs/common';
import { ConfigurationService } from './configuration.service';

export interface ProcessorConfig {
  concurrency: number;
  name: string;
  queue: string;
}

@Injectable()
export class ProcessorConfigService {
  constructor(private readonly configurationService: ConfigurationService) {}

  getOnboardingChecksConfig(): ProcessorConfig {
    return {
      concurrency: this.configurationService.onboardingChecksConcurrency,
      name: 'OnboardingChecksRouter',
      queue: 'onboarding-checks-queue',
    };
  }

  getEmailProcessingConfig(): ProcessorConfig {
    return {
      concurrency: this.configurationService.emailProcessingConcurrency,
      name: 'EmailProcessingRouter',
      queue: 'email-processing-queue',
    };
  }

  getDataExtractionConfig(): ProcessorConfig {
    return {
      concurrency: this.configurationService.dataExtractionConcurrency,
      name: 'DataExtractionRouter',
      queue: 'data-extraction-queue',
    };
  }

  getDocumentSigningConfig(): ProcessorConfig {
    return {
      concurrency: this.configurationService.documentSigningConcurrency,
      name: 'DocumentSigningRouter',
      queue: 'document-signing-queue',
    };
  }

  getDealDeskConfig(): ProcessorConfig {
    return {
      concurrency: this.configurationService.dealDeskConcurrency,
      name: 'DealDeskRouter',
      queue: 'deal-desk-queue',
    };
  }

  getAllProcessorConfigs(): ProcessorConfig[] {
    return [
      this.getOnboardingChecksConfig(),
      this.getEmailProcessingConfig(),
      this.getDataExtractionConfig(),
      this.getDocumentSigningConfig(),
      this.getDealDeskConfig(),
    ];
  }

  getTotalConcurrency(): number {
    return this.getAllProcessorConfigs().reduce(
      (total, config) => total + config.concurrency,
      0
    );
  }

  getProcessorConfigByName(name: string): ProcessorConfig | undefined {
    return this.getAllProcessorConfigs().find(config => config.name === name);
  }

  getProcessorConfigByQueue(queue: string): ProcessorConfig | undefined {
    return this.getAllProcessorConfigs().find(config => config.queue === queue);
  }
}

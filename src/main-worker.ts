import './polyfills';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';
import { ConfigurationValidationService } from './config/configuration-validation.service';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');
  
  try {
    logger.log('🚀 Starting Worker Application...');
    
    const app = await NestFactory.createApplicationContext(WorkerModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // Validate configuration
    const configValidationService = app.get(ConfigurationValidationService);
    configValidationService.validateConfiguration();
    configValidationService.logConfigurationSummary();
    
    logger.log('✅ Worker Application started successfully');
    logger.log('🔄 Workers are now processing jobs...');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.log('🛑 Received SIGINT, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.log('🛑 Received SIGTERM, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });
    
    // Keep the application running
    await new Promise(() => {});
    
  } catch (error) {
    logger.error('❌ Failed to start Worker Application:', error);
    process.exit(1);
  }
}

bootstrap();

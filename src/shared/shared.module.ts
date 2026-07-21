import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import appConfig from '../config/app.config';
import environmentConfig from '../config/environment.config';
import localAgentConfig from '../local-agent/config/local-agent.config';
import { ConfigurationService } from '../config/configuration.service';
import { ProcessorConfigService } from '../config/processor-config.service';
import { ConfigurationValidationService } from '../config/configuration-validation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, environmentConfig, localAgentConfig],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('environment.database.uri'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('environment.redis.host'),
          port: configService.get<number>('environment.redis.port'),
          password: configService.get<string>('environment.redis.password'),
          enableReadyCheck: true,
        },
        defaultJobOptions: {
          removeOnComplete: 1000,
          removeOnFail: 5000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ConfigurationService,
    ProcessorConfigService,
    ConfigurationValidationService,
  ],
  exports: [
    ConfigModule,
    MongooseModule,
    BullModule,
    ConfigurationService,
    ProcessorConfigService,
    ConfigurationValidationService,
  ],
})
export class SharedModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailClientService } from './email-client.service';
import { EMAIL_CLIENT_SERVICE } from './email-client.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailClientService,
    {
      provide: EMAIL_CLIENT_SERVICE,
      inject: [ConfigService, EmailClientService],
      useFactory: (configService: ConfigService, emailService: EmailClientService) => {
        return emailService;
      }
    },
  ],
  exports: [EMAIL_CLIENT_SERVICE],
})
export class EmailClientModule {} 
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailClientService } from './email-client.service';
import { EmailProviderFactory } from './providers/email-provider.factory';
import { EMAIL_CLIENT_SERVICE, EMAIL_PROVIDER_FACTORY } from './email-client.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    EmailProviderFactory,
    EmailClientService,
    {
      provide: EMAIL_CLIENT_SERVICE,
      useExisting: EmailClientService,
    },
    {
      provide: EMAIL_PROVIDER_FACTORY,
      useExisting: EmailProviderFactory,
    },
  ],
  exports: [EMAIL_CLIENT_SERVICE],
})
export class EmailClientModule {} 
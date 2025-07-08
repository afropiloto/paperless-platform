import { Module } from '@nestjs/common';
import { RegistrationModule } from '../registration/registration.module';
import { AccountUsersModule } from '../account-users/account-users.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AccountsQueue } from '../constants/app.constants';
import { BullModule } from '@nestjs/bullmq';
import { NewAccountsProcessor } from './new-accounts.processor';

@Module({
  imports: [
    BullModule.registerQueue({name: AccountsQueue.NEW_ACCOUNT_QUEUE}),
    RegistrationModule,
    AccountsModule,
    AccountUsersModule
  ],
  providers: [NewAccountsProcessor]
})
export class AccountsEventsModule {}

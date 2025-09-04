import { Module } from '@nestjs/common';
import { NamedWalletsController } from './named-wallets.controller';
import { NamedWalletsService } from './named-wallets.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NamedWallet, NamedWalletSchema } from './schemas/named-wallet.schema';
import { AccountsService } from '../accounts/accounts.service';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { NamedWalletsRepository } from './named-wallet.repository';
import { AccountsRepository } from '../accounts/accounts.repository';
import { AccountUsersModule } from '../account-users/account-users.module';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{name: NamedWallet.name, schema: NamedWalletSchema }]),
    MongooseModule.forFeature([{name: Account.name, schema: AccountSchema }]),
    AccountUsersModule,
    JwtConfigModule,
    ApiKeyAuthModule
  ],
  controllers: [NamedWalletsController],
  providers: [NamedWalletsService, NamedWalletsRepository, AccountsService, AccountsRepository],
})
export class NamedWalletsModule {}

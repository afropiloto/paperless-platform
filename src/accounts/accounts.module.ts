import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { AccountsRepository } from './accounts.repository';
import { AccountUsersModule } from '../account-users/account-users.module';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    forwardRef(() => AccountUsersModule),
    JwtConfigModule,
    ApiKeyAuthModule
  ],
  providers: [AccountsService, AccountsRepository],
  controllers: [AccountsController],
  exports: [AccountsService]
})
export class AccountsModule {}

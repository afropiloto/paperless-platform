import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountUsersService } from './account-users.service';
import { AccountUsersController } from './account-users.controller';
import { AccountUsersRepository } from './account-users.repository';
import { AccountUser, AccountUserSchema } from './schemas/account-user.schema';
import { PermissionsValidationService } from './services/permissions-validation.service';
import { ApiKeyAuthModule } from '../api-key-auth/api-key-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountUser.name, schema: AccountUserSchema }
    ]),
    ApiKeyAuthModule
  ],
  providers: [AccountUsersService, AccountUsersRepository, PermissionsValidationService],
  controllers: [AccountUsersController],
  exports: [AccountUsersService, AccountUsersRepository, PermissionsValidationService]
})
export class AccountUsersModule {}

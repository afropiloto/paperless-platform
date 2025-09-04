import { Module, forwardRef } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountUsersService } from './account-users.service';
import { AccountUsersController } from './account-users.controller';
import { AccountUsersRepository } from './account-users.repository';
import { AccountUser, AccountUserSchema } from './schemas';
import { PermissionsValidationService } from './services/permissions-validation.service';
import { ModulePermissions, ModulePermissionsSchema } from './schemas/module-permissions.schema';
import { ModulePermissionsRepository } from './repositories/module-permissions.repository';
import { ModulePermissionsService } from './services/module-permissions.service';
import { ModulePermissionsController } from './controllers/module-permissions.controller';
import { ApiKeyAuthModule } from '../api-key-auth/api-key-auth.module';
import { AccountsModule } from '../accounts/accounts.module';
import { PasswordModule } from '../auth/password.module';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountUser.name, schema: AccountUserSchema },
      { name: ModulePermissions.name, schema: ModulePermissionsSchema },
    ]),
    CacheModule.register(),
    ApiKeyAuthModule,
    forwardRef(() => AccountsModule),
    PasswordModule,
    JwtConfigModule,
  ],
  providers: [
    AccountUsersService,
    AccountUsersRepository,
    PermissionsValidationService,
    ModulePermissionsRepository,
    ModulePermissionsService,
  ],
  controllers: [AccountUsersController, ModulePermissionsController],
  exports: [
    AccountUsersService,
    AccountUsersRepository,
    PermissionsValidationService,
    ModulePermissionsRepository,
    ModulePermissionsService,
  ]
})
export class AccountUsersModule {}

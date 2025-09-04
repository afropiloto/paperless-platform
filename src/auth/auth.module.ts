import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiweService } from '../siwe/siwe.service';
import { AccountsModule } from '../accounts/accounts.module';
import { AccountUsersModule } from '../account-users/account-users.module';
import { SiweModule } from '../siwe/siwe.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { EmailClientModule } from '../email-client/email-client.module';
import { EmailEventsModule } from '../email-events/email-events.module';
import { PasswordModule } from './password.module';
import { MfaService } from './services/mfa.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { AuthEmailService } from './services/auth-email.service';
import { UserManagementService } from './services/user-management.service';
import { UserManagementController } from './controllers/user-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PasswordResetToken, PasswordResetTokenSchema } from './schemas/password-reset-token.schema';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { PasswordResetCleanupService } from './services/password-reset-cleanup.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthEmailProcessor } from './auth-email.processor';
import { ApiKeyAuthModule } from '../api-key-auth/api-key-auth.module';
import { JwtConfigModule } from '../jwt/jwt-config.module';

@Module({
  imports: [
    AuditModule,
    EmailClientModule,
    EmailEventsModule,
    AccountsModule,
    AccountUsersModule,
    SiweModule,
    PasswordModule,
    ApiKeyAuthModule,
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema }
    ]),
    JwtConfigModule,
    ApiKeyAuthModule
  ],
  controllers: [AuthController, UserManagementController],
  providers: [
    AuthService, 
    SiweService, 
    MfaService, 
    EmailTemplatesService, 
    AuthEmailService, 
    UserManagementService, 
    PasswordResetTokenRepository,
    PasswordResetCleanupService,
    AuthEmailProcessor
  ],
  exports: [MfaService, UserManagementService, PasswordResetTokenRepository]
})
export class AuthModule {}

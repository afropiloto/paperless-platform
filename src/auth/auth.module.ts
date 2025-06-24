import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { SiweService } from '../siwe/siwe.service';
import { AccountsModule } from '../accounts/accounts.module';
import { AccountUsersModule } from '../account-users/account-users.module';
import { SiweModule } from '../siwe/siwe.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AccountsModule,
    AccountUsersModule,
    SiweModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secretKey'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SiweService]
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PasswordService } from './services/password.service';

@Module({
  imports: [ConfigModule],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {} 
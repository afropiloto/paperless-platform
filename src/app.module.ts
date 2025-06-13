import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig from './config/app.config';
import { ConfigModule } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { TenantModule } from './tenant/tenant.module';
import { NamedWalletsModule } from './named-wallets/named-wallets.module';
import { TradeDocumentsModule } from './trade-documents/trade-documents.module';
import { BullModule } from '@nestjs/bullmq';
import { DataExtractionModule } from './data-extraction/data-extraction.module';
import { VerifyTradeDocumentModule } from './verify-trade-document/verify-trade-document.module';
import { IssueTradeDocumentModule } from './issue-trade-document/issue-trade-document.module';
import { TradeTrustModule } from './trade-trust/trade-trust.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { RegistrationModule } from './registration/registration.module';
import { VirusScanModule } from './virus-scan/virus-scan.module';
import { AuthModule } from './auth/auth.module';
import { SiweModule } from './siwe/siwe.module';
import { TradeFinanceModule } from './trade-finance/tradeFinanceModule';
import { AppController } from './app.controller';
import { DealDeskModule } from './deal-desk/deal-desk.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/tradedocs',
    ),
    BullModule.forRoot({
      connection: {
        host:  process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || "",
        enableReadyCheck: true,
      },
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
    }),
    AccountsModule,
    HealthcheckModule,
    TenantModule,
    NamedWalletsModule,
    TradeDocumentsModule,
    DataExtractionModule,
    VerifyTradeDocumentModule,
    IssueTradeDocumentModule,
    TradeTrustModule,
    AuditModule,
    AnalyticsModule,
    FileStorageModule,
    RegistrationModule,
    VirusScanModule,
    AuthModule,
    SiweModule,
    TradeFinanceModule,
    DealDeskModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

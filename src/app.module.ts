import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { AccountsModule } from './accounts/accounts.module';
import { HealthcheckModule } from './healthcheck/healthcheck.module';
import { TenantModule } from './tenant/tenant.module';
import { NamedWalletsModule } from './named-wallets/named-wallets.module';
import { TradeDocumentsModule } from './trade-documents/trade-documents.module';
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
import { TradeFinanceModule } from './trade-finance/tradeFinance.module';
import { AppController } from './app.controller';
import { DealDeskModule } from './deal-desk/deal-desk.module';
import { DueDiligenceChecklistsModule } from './due-diligence-checklists/due-diligence-checklists.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AccountUsersModule } from './account-users/account-users.module';
import { ApiKeyAuthModule } from './api-key-auth/api-key-auth.module';
import { DocumentSigningModule } from './document-signing/document-signing.module';
import { ShareLinksModule } from './share-links/share-links.module';
import { EmailClientModule } from './email-client/email-client.module';
import { JwtConfigModule } from './jwt/jwt-config.module';
import { MletrDvpModule } from './mletr-dvp/mletr-dvp.module';

@Module({
  imports: [
    SharedModule,
    JwtConfigModule,
    AccountsModule,
    HealthcheckModule,
    TenantModule,
    NamedWalletsModule,
    TradeDocumentsModule,
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
    DueDiligenceChecklistsModule,
    OnboardingModule,
    AccountUsersModule,
    ApiKeyAuthModule,
    DocumentSigningModule,
    ShareLinksModule,
    EmailClientModule,
    MletrDvpModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { JwtConfigModule } from './jwt/jwt-config.module';
import { AuditModule } from './audit/audit.module';
import { RegistrationModule } from './registration/registration.module';
import { AccountsModule } from './accounts/accounts.module';
import { DueDiligenceChecklistsModule } from './due-diligence-checklists/due-diligence-checklists.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OnboardingChecksModule } from './onboarding-checks/onboarding-checks.module';
import { OnboardingEventsModule } from './onboarding-events/onboarding-events.module';
import { AccountsEventsModule } from './accounts-events/accounts-events.module';
import { DealDeskEventsModule } from './deal-desk-events/deal-desk-events.module';
import { DocumentSigningEventsModule } from './document-signing-events/document-signing-events.module';
import { DataExtractionEventsModule } from './data-extraction-events/data-extraction-events.module';
import { EmailClientModule } from './email-client/email-client.module';
import { TradeDocumentsModule } from './trade-documents/trade-documents.module';
import { TradeTrustModule } from './trade-trust/trade-trust.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { VirusScanModule } from './virus-scan/virus-scan.module';
import { IssueTradeDocumentModule } from './issue-trade-document/issue-trade-document.module';
import { VerifyTradeDocumentModule } from './verify-trade-document/verify-trade-document.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DealDeskModule } from './deal-desk/deal-desk.module';
import { TradeFinanceModule } from './trade-finance/tradeFinance.module';
import { DocumentSigningModule } from './document-signing/document-signing.module';
import { ShareLinksModule } from './share-links/share-links.module';

@Module({
  imports: [
    SharedModule,
    JwtConfigModule,
    AuditModule,
    RegistrationModule,
    AccountsModule,
    DueDiligenceChecklistsModule,
    OnboardingModule,
    OnboardingChecksModule,
    OnboardingEventsModule,
    AccountsEventsModule,
    DealDeskEventsModule,
    DocumentSigningEventsModule,
    DataExtractionEventsModule,
    EmailClientModule,
    TradeDocumentsModule,
    TradeTrustModule,
    FileStorageModule,
    VirusScanModule,
    IssueTradeDocumentModule,
    VerifyTradeDocumentModule,
    AnalyticsModule,
    DealDeskModule,
    TradeFinanceModule,
    DocumentSigningModule,
    ShareLinksModule,
  ],
})
export class WorkerModule {}

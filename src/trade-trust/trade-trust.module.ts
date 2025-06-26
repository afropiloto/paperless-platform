import { Module } from '@nestjs/common';
import { TradeTrustService } from './trade-trust.service';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { AccountsModule } from '../accounts/accounts.module';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';

@Module({
  imports: [
    ConfigModule,
    AuditModule,
    FileStorageModule,
    AccountsModule,
    TradeDocumentsModule,

  ],
  providers: [TradeTrustService],
  exports: [TradeTrustService],

})
export class TradeTrustModule {}

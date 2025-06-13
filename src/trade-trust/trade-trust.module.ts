import { Module } from '@nestjs/common';
import { TradeTrustService } from './trade-trust.service';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TradeDocumentsRepository } from '../trade-documents/trade-documents.repository';
import { AuditModule } from '../audit/audit.module';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { TradeDocumentsService } from '../trade-documents/trade-documents.service';
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

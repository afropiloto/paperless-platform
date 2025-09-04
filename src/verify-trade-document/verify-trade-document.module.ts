import { Module } from '@nestjs/common';
import { VerifyTradeDocumentService } from './verify-trade-document.service';
import { VerifyTradeDocumentController } from './verify-trade-document.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeDocument, TradeDocumentSchema } from '../trade-documents/schema/trade-document.schema';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import { TradeDocumentsRepository } from '../trade-documents/trade-documents.repository';
import { AccountsRepository } from '../accounts/accounts.repository';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TradeDocument.name, schema: TradeDocumentSchema }]),
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    ApiKeyAuthModule,
    ],
  providers: [VerifyTradeDocumentService, TradeDocumentsRepository, AccountsRepository],
  controllers: [VerifyTradeDocumentController]
})
export class VerifyTradeDocumentModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { DvpSettlement, DvpSettlementSchema } from './schemas/dvp-settlement.schema';
import { DvpSettlementRepository } from './dvp-settlement.repository';
import { DvpSettlementService } from './dvp-settlement.service';
import { DvpSettlementController } from './dvp-settlement.controller';
import { StablecoinPaymentService } from './services/stablecoin-payment.service';
import { MletrDocumentService } from './services/mletr-document.service';
import { DvpAgentService } from './services/dvp-agent.service';
import { DvpCoordinatorService } from './services/dvp-coordinator.service';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { TradeTrustModule } from '../trade-trust/trade-trust.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from '../jwt/jwt-config.module';
import { ApiKeyAuthModule } from '../api-key-auth/api-key-auth.module';
import { DvpSettlementQueues } from '../constants/app.constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DvpSettlement.name, schema: DvpSettlementSchema },
    ]),
    BullModule.registerQueue({ name: DvpSettlementQueues.SETTLEMENT_QUEUE }),
    TradeDocumentsModule,
    TradeTrustModule,
    AccountsModule,
    AuditModule,
    JwtConfigModule,
    ApiKeyAuthModule,
  ],
  controllers: [DvpSettlementController],
  providers: [
    DvpSettlementRepository,
    DvpSettlementService,
    StablecoinPaymentService,
    MletrDocumentService,
    DvpAgentService,
    DvpCoordinatorService,
  ],
  exports: [
    DvpSettlementService,
    DvpCoordinatorService,
    StablecoinPaymentService,
    MletrDocumentService,
  ],
})
export class MletrDvpModule {}

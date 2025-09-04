import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShareLinksController } from './share-links.controller';
import { ShareLinksService } from './share-links.service';
import { ShareLinksRepository } from './share-links.repository';
import { ShareLink, ShareLinkSchema } from './schemas/share-link.schema';
import { TradeDocumentsModule } from '../trade-documents/trade-documents.module';
import { AuditModule } from '../audit/audit.module';
import { JwtConfigModule } from 'src/jwt/jwt-config.module';
import { ApiKeyAuthModule } from 'src/api-key-auth/api-key-auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShareLink.name, schema: ShareLinkSchema },
    ]),
    forwardRef(() => TradeDocumentsModule),
    AuditModule,
    JwtConfigModule,
    ApiKeyAuthModule,
  ],
  controllers: [ShareLinksController],
  providers: [ShareLinksService, ShareLinksRepository],
  exports: [ShareLinksService],
})
export class ShareLinksModule {} 
import { Module } from '@nestjs/common';
import { DocumentSigningService } from './document-signing.service';
import { DocumentSigningController } from './document-signing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentSigning, DocumentSigningSchema } from './schemas/document-signing.schema';
import { DocumentSigningRepository } from './document-signing.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: DocumentSigning.name, schema: DocumentSigningSchema },
      ])
  ],
  providers: [DocumentSigningService, DocumentSigningRepository],
  controllers: [DocumentSigningController]
})
export class DocumentSigningModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeDocumentFile, TradeDocumentFileSchema } from './schemas/trade-document-file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradeDocumentFile.name, schema: TradeDocumentFileSchema },
    ]),
  ],
  exports: [
    MongooseModule.forFeature([
      { name: TradeDocumentFile.name, schema: TradeDocumentFileSchema },
    ]),
  ],
})
export class CommonModule {} 
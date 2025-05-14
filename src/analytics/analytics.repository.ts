import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TradeDocument } from '../trade-documents/schema/trade-document.schema';
import { Model } from 'mongoose';

export class AnalyticsRepository {
  private readonly logger = new Logger(AnalyticsRepository.name);
  constructor(@InjectModel(TradeDocument.name)
              private tradeDocumentModel: Model<TradeDocument>) {}




}
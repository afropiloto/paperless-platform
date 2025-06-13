import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TradeFinanceDealStatus } from '../types/trade-finance.types';

@Schema()
class LoanDetails {
  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  loanAmount: number;

  @Prop({ required: true })
  loanDurationDays: number;

  @Prop({ required: true })
  loanCollateralAmount: number;
}

@Schema({ timestamps: true })
export class TradeFinance extends Document {
   
  @Prop({ required: true })
  dealReference: string;

  @Prop({ required: true, index: true })
  accountId: string;

  @Prop({ type: LoanDetails, required: true })
  loanDetails: LoanDetails;

  @Prop({ type: [String], default: [] })
  documentsIds: string[];

  @Prop({ required: true, default: 0 })
  totalValue: number;
  
  @Prop({
    type: String,
    enum: Object.values(TradeFinanceDealStatus),
    default: TradeFinanceDealStatus.IN_PROGRESS,
    required: true,
  })
  dealStatus: TradeFinanceDealStatus;
}

export const TradeFinanceSchema = SchemaFactory.createForClass(TradeFinance);

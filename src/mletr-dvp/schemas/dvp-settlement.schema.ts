import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  AgentDecisionLog,
  DvpSettlementStatus,
  MletrDocumentAttributes,
  SettlementDocumentDetails,
  SettlementPaymentDetails,
  StablecoinType,
} from '../types/dvp-settlement.types';

@Schema({ _id: false, timestamps: false })
export class MletrAttributesSchema implements MletrDocumentAttributes {
  @Prop({ required: false })
  governingLaw?: string;

  @Prop({ required: true })
  isElectronicTransferableRecord: boolean;

  @Prop({ required: true, enum: ['TOKEN_REGISTRY', 'VERIFIABLE_RECORD'] })
  controlMethod: 'TOKEN_REGISTRY' | 'VERIFIABLE_RECORD';

  @Prop({ required: false })
  documentReference?: string;

  @Prop({ required: false })
  sellerParty?: string;

  @Prop({ required: false })
  buyerParty?: string;
}

@Schema({ _id: false, timestamps: false })
export class SettlementPaymentSchema implements SettlementPaymentDetails {
  @Prop({ required: true, enum: StablecoinType })
  stablecoin: StablecoinType;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  amountAtomic: string;

  @Prop({ required: true })
  tokenContractAddress: string;

  @Prop({ required: true, default: 6 })
  decimals: number;

  @Prop({ required: true })
  buyerWalletAddress: string;

  @Prop({ required: true })
  sellerWalletAddress: string;

  @Prop({ required: true })
  escrowWalletAddress: string;

  @Prop({ required: false })
  paymentTxHash?: string;

  @Prop({ required: false })
  releaseTxHash?: string;
}

@Schema({ _id: false, timestamps: false })
export class SettlementDocumentSchema implements SettlementDocumentDetails {
  @Prop({ required: true })
  tradeDocumentId: string;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: false })
  merkleRoot?: string;

  @Prop({ required: false })
  tokenId?: string;

  @Prop({ required: false })
  transferTxHash?: string;

  @Prop({ required: false })
  beneficiaryAddress?: string;

  @Prop({ required: false })
  holderAddress?: string;
}

@Schema({ _id: false, timestamps: false })
export class AgentDecisionSchema implements AgentDecisionLog {
  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  reasoning: string;

  @Prop({ required: true })
  confidence: number;

  @Prop({ required: false, type: Object })
  metadata?: Record<string, unknown>;
}

@Schema({ timestamps: true })
export class DvpSettlement {
  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true, unique: true })
  settlementReference: string;

  @Prop({
    required: true,
    enum: DvpSettlementStatus,
    default: DvpSettlementStatus.DRAFT,
  })
  status: DvpSettlementStatus;

  @Prop({ required: true, type: SettlementDocumentSchema })
  document: SettlementDocumentSchema;

  @Prop({ required: true, type: SettlementPaymentSchema })
  payment: SettlementPaymentSchema;

  @Prop({ required: true, type: MletrAttributesSchema })
  mletrAttributes: MletrAttributesSchema;

  @Prop({ required: false })
  failureReason?: string;

  @Prop({ required: false, type: Date })
  settledAt?: Date;

  @Prop({ required: true, type: [AgentDecisionSchema], default: [] })
  agentDecisions: AgentDecisionSchema[];
}

export type DvpSettlementDocument = DvpSettlement & Document;
export const DvpSettlementSchema = SchemaFactory.createForClass(DvpSettlement);

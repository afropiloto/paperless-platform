import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AttentionSector, SocialPlatform } from '../types/attention-index.types';

@Schema({ timestamps: true })
export class AttentionConstituent extends Document {
  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: AttentionSector, type: String })
  sector: AttentionSector;

  @Prop({ required: true, enum: SocialPlatform, type: String })
  platform: SocialPlatform;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: false })
  description?: string;
}

export const AttentionConstituentSchema = SchemaFactory.createForClass(AttentionConstituent);

@Schema({ timestamps: true })
export class AttentionSnapshot extends Document {
  @Prop({ required: true, index: true })
  indexSymbol: string;

  @Prop({ required: true })
  indexValue: number;

  @Prop({ required: true })
  previousValue: number;

  @Prop({ required: true })
  changePercent: number;

  @Prop({ required: true })
  methodologyVersion: string;

  @Prop({ required: true })
  dataProvenanceHash: string;

  @Prop({ required: true })
  calculatedAt: Date;

  @Prop({ type: Array, default: [] })
  constituents: Array<{
    symbol: string;
    name: string;
    sector: string;
    platform: string;
    rawScore: number;
    adjustedScore: number;
    weight: number;
    mentionVolume: number;
    engagementRate: number;
    uniqueReach: number;
    botScore: number;
    anomalyFlags: string[];
  }>;

  @Prop({ type: Array, default: [] })
  anomalies: Array<{
    symbol: string;
    severity: string;
    type: string;
    description: string;
    zScore?: number;
  }>;
}

export const AttentionSnapshotSchema = SchemaFactory.createForClass(AttentionSnapshot);
AttentionSnapshotSchema.index({ indexSymbol: 1, calculatedAt: -1 });

@Schema({ timestamps: true })
export class AttentionIndexEvent extends Document {
  @Prop({ required: true, index: true })
  indexSymbol: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, unknown>;

  @Prop({ required: false })
  provenanceHash?: string;
}

export const AttentionIndexEventSchema = SchemaFactory.createForClass(AttentionIndexEvent);

@Schema({ timestamps: true })
export class AttentionMetricsReading extends Document {
  @Prop({ required: true, index: true })
  symbol: string;

  @Prop({ required: true })
  mentionVolume: number;

  @Prop({ required: true })
  engagementRate: number;

  @Prop({ required: true })
  uniqueReach: number;

  @Prop({ required: true })
  previousMentionVolume: number;

  @Prop({ required: true, default: 0 })
  botScore: number;

  @Prop({ required: true })
  recordedAt: Date;
}

export const AttentionMetricsReadingSchema = SchemaFactory.createForClass(AttentionMetricsReading);
AttentionMetricsReadingSchema.index({ symbol: 1, recordedAt: -1 });

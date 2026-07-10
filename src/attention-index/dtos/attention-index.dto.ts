import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AttentionSector, SocialPlatform } from '../types/attention-index.types';

export class HistoryQueryDto {
  @ApiProperty({ required: false, default: 30, description: 'Number of days of history' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  days?: number = 30;
}

export class ConstituentScoreDto {
  @ApiProperty() @Expose() symbol: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty() @Expose() sector: string;
  @ApiProperty() @Expose() platform: string;
  @ApiProperty() @Expose() rawScore: number;
  @ApiProperty() @Expose() adjustedScore: number;
  @ApiProperty() @Expose() weight: number;
  @ApiProperty() @Expose() mentionVolume: number;
  @ApiProperty() @Expose() engagementRate: number;
  @ApiProperty() @Expose() uniqueReach: number;
  @ApiProperty() @Expose() botScore: number;
  @ApiProperty() @Expose() anomalyFlags: string[];
}

export class AnomalyDto {
  @ApiProperty() @Expose() symbol: string;
  @ApiProperty() @Expose() severity: string;
  @ApiProperty() @Expose() type: string;
  @ApiProperty() @Expose() description: string;
  @ApiProperty({ required: false }) @Expose() zScore?: number;
}

export class IndexSnapshotDto {
  @ApiProperty() @Expose() indexSymbol: string;
  @ApiProperty() @Expose() indexValue: number;
  @ApiProperty() @Expose() previousValue: number;
  @ApiProperty() @Expose() changePercent: number;
  @ApiProperty() @Expose() methodologyVersion: string;
  @ApiProperty() @Expose() dataProvenanceHash: string;
  @ApiProperty() @Expose() calculatedAt: Date;
  @ApiProperty({ type: [ConstituentScoreDto] })
  @Expose()
  @Type(() => ConstituentScoreDto)
  constituents: ConstituentScoreDto[];
  @ApiProperty({ type: [AnomalyDto] })
  @Expose()
  @Type(() => AnomalyDto)
  anomalies: AnomalyDto[];
}

export class IndexHistoryPointDto {
  @ApiProperty() @Expose() calculatedAt: Date;
  @ApiProperty() @Expose() indexValue: number;
  @ApiProperty() @Expose() changePercent: number;
}

export class SubIndexDto {
  @ApiProperty() @Expose() symbol: string;
  @ApiProperty() @Expose() sector: string;
  @ApiProperty() @Expose() indexValue: number;
  @ApiProperty() @Expose() changePercent: number;
  @ApiProperty() @Expose() constituentCount: number;
}

export class DashboardSummaryDto {
  @ApiProperty() @Expose() indexSymbol: string;
  @ApiProperty() @Expose() indexValue: number;
  @ApiProperty() @Expose() changePercent: number;
  @ApiProperty() @Expose() change24h: number;
  @ApiProperty() @Expose() change7d: number;
  @ApiProperty() @Expose() calculatedAt: Date;
  @ApiProperty() @Expose() methodologyVersion: string;
  @ApiProperty() @Expose() dataProvenanceHash: string;
  @ApiProperty() @Expose() activeConstituents: number;
  @ApiProperty() @Expose() anomalyCount: number;
  @ApiProperty({ type: [SubIndexDto] })
  @Expose()
  @Type(() => SubIndexDto)
  subIndices: SubIndexDto[];
  @ApiProperty({ type: [ConstituentScoreDto] })
  @Expose()
  @Type(() => ConstituentScoreDto)
  topMovers: ConstituentScoreDto[];
}

export class AuditEventDto {
  @ApiProperty() @Expose() eventType: string;
  @ApiProperty() @Expose() description: string;
  @ApiProperty() @Expose() createdAt: Date;
  @ApiProperty() @Expose() provenanceHash?: string;
  @ApiProperty() @Expose() details: Record<string, unknown>;
}

export class ConstituentDto {
  @ApiProperty() @Expose() symbol: string;
  @ApiProperty() @Expose() name: string;
  @ApiProperty({ enum: AttentionSector }) @Expose() sector: AttentionSector;
  @ApiProperty({ enum: SocialPlatform }) @Expose() platform: SocialPlatform;
  @ApiProperty() @Expose() isActive: boolean;
  @ApiProperty({ required: false }) @Expose() description?: string;
}

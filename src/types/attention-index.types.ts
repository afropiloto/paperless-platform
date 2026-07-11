export enum AttentionSector {
  TECHNOLOGY = 'technology',
  POLITICS = 'politics',
  CULTURE = 'culture',
  ECONOMY = 'economy',
  HEALTH = 'health',
  SPORTS = 'sports',
}

export enum SocialPlatform {
  TWITTER = 'twitter',
  REDDIT = 'reddit',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  NEWS = 'news',
}

export enum IndexEventType {
  CALCULATION = 'calculation',
  REBALANCE = 'rebalance',
  CONSTITUENT_ADDED = 'constituent_added',
  CONSTITUENT_REMOVED = 'constituent_removed',
  ANOMALY_DETECTED = 'anomaly_detected',
  METHODOLOGY_UPDATE = 'methodology_update',
}

export enum AnomalySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AttentionMetricsInput {
  mentionVolume: number;
  engagementRate: number;
  uniqueReach: number;
  previousMentionVolume: number;
  botScore: number;
  impressions?: number;
}

export interface ScoredConstituent {
  symbol: string;
  name: string;
  sector: AttentionSector;
  platform: SocialPlatform;
  rawScore: number;
  adjustedScore: number;
  weight: number;
  metrics: AttentionMetricsInput;
  anomalyFlags: string[];
}

export interface IndexCalculationResult {
  indexSymbol: string;
  indexValue: number;
  previousValue: number;
  changePercent: number;
  constituents: ScoredConstituent[];
  methodologyVersion: string;
  calculatedAt: Date;
  dataProvenanceHash: string;
  anomalies: IndexAnomaly[];
}

export interface IndexAnomaly {
  symbol: string;
  severity: AnomalySeverity;
  type: string;
  description: string;
  zScore?: number;
}

export const METHODOLOGY_VERSION = '1.0.0';
export const INDEX_BASE_VALUE = 1000;
export const INDEX_SYMBOL = 'ATTN';

export const SCORING_WEIGHTS = {
  volume: 0.35,
  engagement: 0.25,
  reach: 0.2,
  velocity: 0.2,
} as const;

export const BOT_DAMPENING_FACTOR = 0.85;
export const VOLUME_ZSCORE_THRESHOLD = 3;
export const MIN_LIQUIDITY_MENTIONS = 100;

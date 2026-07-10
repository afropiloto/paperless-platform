import { createHash } from 'crypto';
import {
  AttentionMetricsInput,
  AttentionSector,
  AnomalySeverity,
  BOT_DAMPENING_FACTOR,
  INDEX_BASE_VALUE,
  IndexAnomaly,
  IndexCalculationResult,
  METHODOLOGY_VERSION,
  MIN_LIQUIDITY_MENTIONS,
  SCORING_WEIGHTS,
  ScoredConstituent,
  SocialPlatform,
  VOLUME_ZSCORE_THRESHOLD,
} from '../types/attention-index.types';

export interface ConstituentInput {
  symbol: string;
  name: string;
  sector: AttentionSector;
  platform: SocialPlatform;
  metrics: AttentionMetricsInput;
  isActive?: boolean;
}

export interface IndexSnapshotInput {
  indexSymbol: string;
  previousValue: number;
  constituents: ConstituentInput[];
  calculatedAt?: Date;
}

export class AttentionScoringEngine {
  computeRawScore(metrics: AttentionMetricsInput): number {
    const volumeComponent =
      SCORING_WEIGHTS.volume * Math.log10(1 + Math.max(metrics.mentionVolume, 0));
    const engagementComponent =
      SCORING_WEIGHTS.engagement * Math.min(Math.max(metrics.engagementRate, 0), 1);
    const reachComponent =
      SCORING_WEIGHTS.reach * Math.log10(1 + Math.max(metrics.uniqueReach, 0));

    const epsilon = 1;
    const prevVolume = Math.max(metrics.previousMentionVolume, epsilon);
    const velocity = (metrics.mentionVolume - metrics.previousMentionVolume) / prevVolume;
    const velocityComponent =
      SCORING_WEIGHTS.velocity * Math.tanh(velocity);

    return volumeComponent + engagementComponent + reachComponent + velocityComponent;
  }

  applyQualityAdjustments(
    rawScore: number,
    metrics: AttentionMetricsInput,
    volumeZScore: number,
  ): { adjustedScore: number; flags: string[] } {
    const flags: string[] = [];
    let adjusted = rawScore;

    const botPenalty = Math.min(Math.max(metrics.botScore, 0), 1) * BOT_DAMPENING_FACTOR;
    if (botPenalty > 0.1) {
      adjusted *= 1 - botPenalty;
      flags.push(`bot_activity_dampened:${(botPenalty * 100).toFixed(1)}%`);
    }

    if (volumeZScore > VOLUME_ZSCORE_THRESHOLD) {
      const excess = volumeZScore - VOLUME_ZSCORE_THRESHOLD;
      adjusted *= 1 / Math.sqrt(1 + excess);
      flags.push(`volume_spike_capped:z=${volumeZScore.toFixed(2)}`);
    }

    if (metrics.mentionVolume < MIN_LIQUIDITY_MENTIONS) {
      adjusted *= metrics.mentionVolume / MIN_LIQUIDITY_MENTIONS;
      flags.push('below_liquidity_threshold');
    }

    return { adjustedScore: Math.max(adjusted, 0), flags };
  }

  computeVolumeZScores(volumes: number[]): number[] {
    if (volumes.length === 0) return [];
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance =
      volumes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / volumes.length;
    const stdDev = Math.sqrt(variance) || 1;
    return volumes.map((v) => (v - mean) / stdDev);
  }

  computeWeights(scored: ScoredConstituent[]): ScoredConstituent[] {
    const total = scored.reduce((sum, c) => sum + c.adjustedScore, 0);
    if (total === 0) {
      const equalWeight = 100 / scored.length;
      return scored.map((c) => ({ ...c, weight: equalWeight }));
    }
    return scored.map((c) => ({
      ...c,
      weight: (c.adjustedScore / total) * 100,
    }));
  }

  detectAnomalies(
    constituents: ScoredConstituent[],
    volumeZScores: number[],
  ): IndexAnomaly[] {
    const anomalies: IndexAnomaly[] = [];

    constituents.forEach((c, i) => {
      const z = volumeZScores[i];
      if (z > VOLUME_ZSCORE_THRESHOLD) {
        anomalies.push({
          symbol: c.symbol,
          severity:
            z > 5 ? AnomalySeverity.CRITICAL : z > 4 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
          type: 'volume_spike',
          description: `Abnormal mention volume detected for ${c.name}`,
          zScore: z,
        });
      }
      if (c.metrics.botScore > 0.7) {
        anomalies.push({
          symbol: c.symbol,
          severity: AnomalySeverity.HIGH,
          type: 'coordinated_activity',
          description: `Elevated bot/coordination score (${(c.metrics.botScore * 100).toFixed(0)}%) for ${c.name}`,
        });
      }
      if (c.weight > 25) {
        anomalies.push({
          symbol: c.symbol,
          severity: AnomalySeverity.MEDIUM,
          type: 'concentration_risk',
          description: `${c.name} exceeds 25% index weight — concentration review required`,
        });
      }
    });

    return anomalies;
  }

  computeIndexValue(
    constituents: ScoredConstituent[],
    previousConstituents: Map<string, number>,
    previousIndexValue: number,
  ): number {
    if (previousConstituents.size === 0 || previousIndexValue <= 0) {
      return INDEX_BASE_VALUE;
    }

    let weightedReturn = 0;
    let totalWeight = 0;

    for (const c of constituents) {
      const prevScore = previousConstituents.get(c.symbol);
      if (prevScore && prevScore > 0) {
        const constituentReturn = c.adjustedScore / prevScore - 1;
        weightedReturn += (c.weight / 100) * constituentReturn;
        totalWeight += c.weight;
      }
    }

    if (totalWeight === 0) return previousIndexValue;
    return previousIndexValue * (1 + weightedReturn);
  }

  calculate(input: IndexSnapshotInput): IndexCalculationResult {
    const active = input.constituents.filter((c) => c.isActive !== false);
    const volumes = active.map((c) => c.metrics.mentionVolume);
    const volumeZScores = this.computeVolumeZScores(volumes);

    let scored: ScoredConstituent[] = active.map((c, i) => {
      const rawScore = this.computeRawScore(c.metrics);
      const { adjustedScore, flags } = this.applyQualityAdjustments(
        rawScore,
        c.metrics,
        volumeZScores[i],
      );
      return {
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
        platform: c.platform,
        rawScore,
        adjustedScore,
        weight: 0,
        metrics: c.metrics,
        anomalyFlags: flags,
      };
    });

    scored = this.computeWeights(scored);
    const anomalies = this.detectAnomalies(scored, volumeZScores);

    const previousScores = new Map(
      active.map((c) => [c.symbol, this.computeRawScore(c.metrics)]),
    );
    const indexValue = this.computeIndexValue(
      scored,
      previousScores,
      input.previousValue || INDEX_BASE_VALUE,
    );

    const previousValue = input.previousValue || INDEX_BASE_VALUE;
    const changePercent = ((indexValue - previousValue) / previousValue) * 100;

    const provenancePayload = JSON.stringify({
      constituents: scored.map((c) => ({
        symbol: c.symbol,
        adjustedScore: c.adjustedScore,
        weight: c.weight,
      })),
      methodologyVersion: METHODOLOGY_VERSION,
      calculatedAt: (input.calculatedAt ?? new Date()).toISOString(),
    });

    return {
      indexSymbol: input.indexSymbol,
      indexValue: Math.round(indexValue * 100) / 100,
      previousValue,
      changePercent: Math.round(changePercent * 100) / 100,
      constituents: scored,
      methodologyVersion: METHODOLOGY_VERSION,
      calculatedAt: input.calculatedAt ?? new Date(),
      dataProvenanceHash: createHash('sha256').update(provenancePayload).digest('hex'),
      anomalies,
    };
  }

  getMethodologyDocumentation() {
    return {
      version: METHODOLOGY_VERSION,
      indexSymbol: 'ATTN',
      baseValue: INDEX_BASE_VALUE,
      description:
        'ATTN Composite Index measures aggregate social media attention using float-adjusted, market-cap-style weighting across a diversified constituent basket.',
      scoringFormula: {
        rawScore:
          'α·log₁₀(1+V) + β·E + γ·log₁₀(1+R) + δ·tanh(velocity) where V=mentions, E=engagement rate [0,1], R=unique reach, velocity=(Vₜ-Vₜ₋₁)/Vₜ₋₁',
        weights: SCORING_WEIGHTS,
        qualityAdjustments: [
          `Bot dampening: score × (1 - botScore × ${BOT_DAMPENING_FACTOR})`,
          `Volume spike cap: when z-score > ${VOLUME_ZSCORE_THRESHOLD}, apply √(excess) dampening`,
          `Liquidity floor: constituents below ${MIN_LIQUIDITY_MENTIONS} mentions/day are proportionally down-weighted`,
        ],
      },
      indexCalculation:
        'Chain-linked Laspeyres: Indexₜ = Indexₜ₋₁ × (1 + Σ(wᵢ × (scoreᵢₜ/scoreᵢₜ₋₁ - 1)))',
      rebalancePolicy:
        'Quarterly review; constituents must maintain minimum liquidity; 5-day public notice before basket changes',
      regulatoryCompliance: [
        'SHA-256 provenance hash on every calculation snapshot',
        'Immutable audit trail for rebalances and methodology changes',
        'Anomaly detection with severity classification',
        'Full constituent-level score decomposition available via API',
        'Source platform attribution per constituent',
      ],
      subIndices: [
        { symbol: 'ATTN-TECH', sector: 'technology' },
        { symbol: 'ATTN-POL', sector: 'politics' },
        { symbol: 'ATTN-CUL', sector: 'culture' },
        { symbol: 'ATTN-ECON', sector: 'economy' },
        { symbol: 'ATTN-HLT', sector: 'health' },
        { symbol: 'ATTN-SPT', sector: 'sports' },
      ],
    };
  }
}

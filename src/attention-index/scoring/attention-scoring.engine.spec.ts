import { AttentionScoringEngine } from './attention-scoring.engine';
import {
  AttentionSector,
  INDEX_BASE_VALUE,
  SocialPlatform,
} from '../types/attention-index.types';

describe('AttentionScoringEngine', () => {
  const engine = new AttentionScoringEngine();

  const baseMetrics = {
    mentionVolume: 5000,
    engagementRate: 0.08,
    uniqueReach: 2000,
    previousMentionVolume: 4500,
    botScore: 0.1,
  };

  const baseConstituent = {
    symbol: 'TEST-ATTN',
    name: 'Test Topic',
    sector: AttentionSector.TECHNOLOGY,
    platform: SocialPlatform.TWITTER,
    metrics: baseMetrics,
  };

  describe('computeRawScore', () => {
    it('returns higher score for higher mention volume', () => {
      const low = engine.computeRawScore({ ...baseMetrics, mentionVolume: 100 });
      const high = engine.computeRawScore({ ...baseMetrics, mentionVolume: 50000 });
      expect(high).toBeGreaterThan(low);
    });

    it('returns higher score for higher engagement', () => {
      const low = engine.computeRawScore({ ...baseMetrics, engagementRate: 0.01 });
      const high = engine.computeRawScore({ ...baseMetrics, engagementRate: 0.15 });
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('applyQualityAdjustments', () => {
    it('dampens score when bot score is high', () => {
      const raw = 1.5;
      const lowBot = engine.applyQualityAdjustments(raw, { ...baseMetrics, botScore: 0 }, 0);
      const highBot = engine.applyQualityAdjustments(raw, { ...baseMetrics, botScore: 0.9 }, 0);
      expect(highBot.adjustedScore).toBeLessThan(lowBot.adjustedScore);
      expect(highBot.flags.some((f) => f.includes('bot_activity'))).toBe(true);
    });

    it('caps volume spikes with high z-score', () => {
      const raw = 2.0;
      const normal = engine.applyQualityAdjustments(raw, baseMetrics, 1);
      const spike = engine.applyQualityAdjustments(raw, baseMetrics, 5);
      expect(spike.adjustedScore).toBeLessThan(normal.adjustedScore);
      expect(spike.flags.some((f) => f.includes('volume_spike'))).toBe(true);
    });
  });

  describe('computeWeights', () => {
    it('weights sum to approximately 100', () => {
      const result = engine.calculate({
        indexSymbol: 'ATTN',
        previousValue: INDEX_BASE_VALUE,
        constituents: [
          baseConstituent,
          { ...baseConstituent, symbol: 'TEST2-ATTN', metrics: { ...baseMetrics, mentionVolume: 10000 } },
        ],
      });
      const totalWeight = result.constituents.reduce((s, c) => s + c.weight, 0);
      expect(totalWeight).toBeCloseTo(100, 0);
    });
  });

  describe('calculate', () => {
    it('produces a valid index snapshot with provenance hash', () => {
      const result = engine.calculate({
        indexSymbol: 'ATTN',
        previousValue: INDEX_BASE_VALUE,
        constituents: [baseConstituent],
      });

      expect(result.indexSymbol).toBe('ATTN');
      expect(result.indexValue).toBeGreaterThan(0);
      expect(result.dataProvenanceHash).toHaveLength(64);
      expect(result.methodologyVersion).toBe('1.0.0');
      expect(result.constituents).toHaveLength(1);
    });

    it('detects concentration risk for dominant constituent', () => {
      const result = engine.calculate({
        indexSymbol: 'ATTN',
        previousValue: INDEX_BASE_VALUE,
        constituents: [
          { ...baseConstituent, metrics: { ...baseMetrics, mentionVolume: 500000 } },
          { ...baseConstituent, symbol: 'SMALL-ATTN', metrics: { ...baseMetrics, mentionVolume: 50 } },
        ],
      });
      const concentration = result.anomalies.find((a) => a.type === 'concentration_risk');
      expect(concentration).toBeDefined();
    });
  });

  describe('getMethodologyDocumentation', () => {
    it('returns complete methodology for regulatory review', () => {
      const doc = engine.getMethodologyDocumentation();
      expect(doc.version).toBeDefined();
      expect(doc.scoringFormula.weights).toBeDefined();
      expect(doc.regulatoryCompliance.length).toBeGreaterThan(0);
      expect(doc.subIndices.length).toBe(6);
    });
  });
});

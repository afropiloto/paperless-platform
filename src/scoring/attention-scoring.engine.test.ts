import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AttentionScoringEngine } from './attention-scoring.engine.js';
import {
  AttentionSector,
  INDEX_BASE_VALUE,
  SocialPlatform,
} from '../types/attention-index.types.js';

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

  test('higher mention volume yields higher raw score', () => {
    const low = engine.computeRawScore({ ...baseMetrics, mentionVolume: 100 });
    const high = engine.computeRawScore({ ...baseMetrics, mentionVolume: 50000 });
    assert.ok(high > low);
  });

  test('bot dampening reduces adjusted score', () => {
    const raw = 1.5;
    const lowBot = engine.applyQualityAdjustments(raw, { ...baseMetrics, botScore: 0 }, 0);
    const highBot = engine.applyQualityAdjustments(raw, { ...baseMetrics, botScore: 0.9 }, 0);
    assert.ok(highBot.adjustedScore < lowBot.adjustedScore);
    assert.ok(highBot.flags.some((f) => f.includes('bot_activity')));
  });

  test('weights sum to approximately 100', () => {
    const result = engine.calculate({
      indexSymbol: 'ATTN',
      previousValue: INDEX_BASE_VALUE,
      constituents: [
        baseConstituent,
        {
          ...baseConstituent,
          symbol: 'TEST2-ATTN',
          metrics: { ...baseMetrics, mentionVolume: 10000 },
        },
      ],
    });
    const totalWeight = result.constituents.reduce((s, c) => s + c.weight, 0);
    assert.ok(Math.abs(totalWeight - 100) < 1);
  });

  test('produces provenance hash on calculation', () => {
    const result = engine.calculate({
      indexSymbol: 'ATTN',
      previousValue: INDEX_BASE_VALUE,
      constituents: [baseConstituent],
    });
    assert.equal(result.dataProvenanceHash.length, 64);
    assert.equal(result.methodologyVersion, '1.0.0');
  });
});

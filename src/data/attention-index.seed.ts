import { AttentionSector, INDEX_SYMBOL, SocialPlatform } from '../types/attention-index.types.js';
import { ConstituentInput } from '../scoring/attention-scoring.engine.js';

export const DEFAULT_CONSTITUENTS: Omit<ConstituentInput, 'metrics'>[] = [
  { symbol: 'AAPL-ATTN', name: 'Apple Inc.', sector: AttentionSector.TECHNOLOGY, platform: SocialPlatform.TWITTER },
  { symbol: 'NVDA-ATTN', name: 'NVIDIA', sector: AttentionSector.TECHNOLOGY, platform: SocialPlatform.REDDIT },
  { symbol: 'OPENAI-ATTN', name: 'OpenAI / ChatGPT', sector: AttentionSector.TECHNOLOGY, platform: SocialPlatform.TWITTER },
  { symbol: 'BTC-ATTN', name: 'Bitcoin', sector: AttentionSector.ECONOMY, platform: SocialPlatform.TWITTER },
  { symbol: 'ELEC-ATTN', name: 'US Elections', sector: AttentionSector.POLITICS, platform: SocialPlatform.NEWS },
  { symbol: 'TAYLOR-ATTN', name: 'Taylor Swift', sector: AttentionSector.CULTURE, platform: SocialPlatform.INSTAGRAM },
  { symbol: 'NFL-ATTN', name: 'NFL', sector: AttentionSector.SPORTS, platform: SocialPlatform.TWITTER },
  { symbol: 'COVID-ATTN', name: 'Public Health', sector: AttentionSector.HEALTH, platform: SocialPlatform.NEWS },
  { symbol: 'TIKTOK-ATTN', name: 'TikTok Platform', sector: AttentionSector.CULTURE, platform: SocialPlatform.TIKTOK },
  { symbol: 'FED-ATTN', name: 'Federal Reserve', sector: AttentionSector.ECONOMY, platform: SocialPlatform.NEWS },
  { symbol: 'META-ATTN', name: 'Meta Platforms', sector: AttentionSector.TECHNOLOGY, platform: SocialPlatform.TWITTER },
  { symbol: 'CLIMATE-ATTN', name: 'Climate Change', sector: AttentionSector.POLITICS, platform: SocialPlatform.REDDIT },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateMetricsForSymbol(symbol: string, dayOffset: number = 0): ConstituentInput['metrics'] {
  const hash = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (offset: number) => seededRandom(hash + dayOffset * 17 + offset);

  const baseVolume = 500 + r(1) * 15000;
  const mentionVolume = Math.round(baseVolume * (0.85 + r(2) * 0.3));
  const previousMentionVolume = Math.round(mentionVolume * (0.7 + r(3) * 0.6));
  const engagementRate = 0.02 + r(4) * 0.15;
  const uniqueReach = Math.round(mentionVolume * (0.3 + r(5) * 0.5));
  const botScore = r(6) * 0.4;

  return { mentionVolume, engagementRate, uniqueReach, previousMentionVolume, botScore };
}

export function buildConstituentInputs(dayOffset: number = 0): ConstituentInput[] {
  return DEFAULT_CONSTITUENTS.map((c) => ({
    ...c,
    metrics: generateMetricsForSymbol(c.symbol, dayOffset),
  }));
}

export const SUB_INDEX_SYMBOLS: Record<string, AttentionSector> = {
  'ATTN-TECH': AttentionSector.TECHNOLOGY,
  'ATTN-POL': AttentionSector.POLITICS,
  'ATTN-CUL': AttentionSector.CULTURE,
  'ATTN-ECON': AttentionSector.ECONOMY,
  'ATTN-HLT': AttentionSector.HEALTH,
  'ATTN-SPT': AttentionSector.SPORTS,
};

export { INDEX_SYMBOL };

import { MemoryService } from './memory.service';
import { MemoryKind } from '../local-agent.constants';

describe('MemoryService scoring helpers', () => {
  const vertexAi = {
    embed: jest.fn(async (text: string) => ({
      values: hash(text),
      model: 'mock',
      provider: 'mock',
    })),
    localHashEmbedding: (text: string) => hash(text),
  };

  const configService = {
    get: () => ({ memoryTopK: 5, workingMemoryLimit: 10 }),
  };

  const stored: any[] = [];
  const memoryModel = {
    create: jest.fn(async (doc: any) => {
      const row = { id: `m${stored.length + 1}`, ...doc };
      stored.push(row);
      return row;
    }),
    find: jest.fn(() => ({
      sort: () => ({
        limit: () => ({
          exec: async () => stored,
        }),
      }),
    })),
    findOneAndUpdate: jest.fn(),
  };

  const service = new MemoryService(
    memoryModel as any,
    vertexAi as any,
    configService as any,
  );

  it('stores and recalls related memories by hybrid score', async () => {
    await service.store({
      kind: MemoryKind.SEMANTIC,
      content: 'Prefer short status briefs every morning',
      importance: 0.9,
      tags: ['preference'],
    });
    await service.store({
      kind: MemoryKind.EPISODIC,
      content: 'Discussed TradeTrust DNS-TXT setup for production',
      importance: 0.5,
    });

    const results = await service.recall({ query: 'morning status brief preference' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].memory.content.toLowerCase()).toContain('brief');
  });
});

function hash(text: string, dims = 32): number[] {
  const values = new Array(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    values[i % dims] += text.charCodeAt(i) / 255;
  }
  const mag = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
  return values.map((v) => v / mag);
}

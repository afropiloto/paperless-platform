import { AgentRole } from './local-agent.constants';
import { scoreRoleForMessage } from './roles/role.definitions';
import { VertexAiService } from './gcp/vertex-ai.service';
import { ConfigService } from '@nestjs/config';

describe('Local agent role routing', () => {
  it('routes marketing copy to CMO', () => {
    expect(scoreRoleForMessage('Draft a LinkedIn campaign positioning')).toBe(AgentRole.CMO);
  });

  it('routes build / milestone language to PM', () => {
    expect(scoreRoleForMessage('Unblock the sprint milestone and kick off build')).toBe(
      AgentRole.PM,
    );
  });

  it('routes twin phrasing to twin', () => {
    expect(scoreRoleForMessage('Decide for me in my voice as twin')).toBe(AgentRole.TWIN);
  });
});

describe('VertexAiService mock mode', () => {
  const configService = {
    get: () => ({
      enabled: true,
      provider: 'mock',
      projectId: '',
      location: 'us-central1',
      chatModel: 'gemini-2.0-flash-001',
      embeddingModel: 'text-embedding-004',
      temperature: 0.4,
      maxOutputTokens: 2048,
      memoryTopK: 8,
      workingMemoryLimit: 20,
      allowLocalBuilds: false,
    }),
  } as unknown as ConfigService;

  const service = new VertexAiService(configService);

  it('generates a mock reply', async () => {
    const result = await service.generate([{ role: 'user', content: 'hello PA' }], {
      systemInstruction: 'You are the PA',
    });
    expect(result.provider).toBe('mock');
    expect(result.text).toContain('hello PA');
  });

  it('produces stable local embeddings', async () => {
    const a = await service.embed('trade trust issuance');
    const b = await service.embed('trade trust issuance');
    expect(a.values).toEqual(b.values);
    expect(a.values.length).toBeGreaterThan(8);
  });
});

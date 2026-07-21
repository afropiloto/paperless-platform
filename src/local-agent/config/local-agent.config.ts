import { registerAs } from '@nestjs/config';
import type { AgentProvider } from '../local-agent.types';

export interface LocalAgentConfig {
  enabled: boolean;
  provider: AgentProvider;
  projectId: string;
  location: string;
  chatModel: string;
  embeddingModel: string;
  temperature: number;
  maxOutputTokens: number;
  memoryTopK: number;
  workingMemoryLimit: number;
  allowLocalBuilds: boolean;
  geminiApiKey?: string;
}

export default registerAs('localAgent', (): LocalAgentConfig => ({
  enabled: process.env.LOCAL_AGENT_ENABLED !== 'false',
  provider: (process.env.LOCAL_AGENT_PROVIDER as AgentProvider) || 'mock',
  projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
  location: process.env.GCP_LOCATION || 'us-central1',
  chatModel:
    process.env.LOCAL_AGENT_CHAT_MODEL ||
    process.env.VERTEX_CHAT_MODEL ||
    'gemini-2.0-flash-001',
  embeddingModel:
    process.env.LOCAL_AGENT_EMBEDDING_MODEL ||
    process.env.VERTEX_EMBEDDING_MODEL ||
    'text-embedding-004',
  temperature: parseFloat(process.env.LOCAL_AGENT_TEMPERATURE || '0.4'),
  maxOutputTokens: parseInt(process.env.LOCAL_AGENT_MAX_OUTPUT_TOKENS || '2048', 10),
  memoryTopK: parseInt(process.env.LOCAL_AGENT_MEMORY_TOP_K || '8', 10),
  workingMemoryLimit: parseInt(process.env.LOCAL_AGENT_WORKING_MEMORY_LIMIT || '20', 10),
  allowLocalBuilds: process.env.LOCAL_AGENT_ALLOW_BUILDS === 'true',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
}));

export type AgentProvider = 'vertex' | 'gemini-api' | 'mock';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  toolsHint?: string[];
}

export interface GenerateResult {
  text: string;
  model: string;
  provider: AgentProvider;
  usage?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

export interface EmbeddingResult {
  values: number[];
  model: string;
  provider: AgentProvider;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  roles?: string[];
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

export interface ToolContext {
  accountId?: string;
  userId?: string;
  sessionId: string;
  role: string;
}

export interface AgentTurnResult {
  sessionId: string;
  role: string;
  reply: string;
  model: string;
  provider: string;
  memoriesUsed: number;
  toolCalls: Array<{ name: string; result: unknown }>;
  taskIds: string[];
}

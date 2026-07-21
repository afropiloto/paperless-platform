import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import type { LocalAgentConfig } from '../config/local-agent.config';
import type {
  AgentProvider,
  ChatMessage,
  EmbeddingResult,
  GenerateOptions,
  GenerateResult,
} from '../local-agent.types';

@Injectable()
export class VertexAiService {
  private readonly logger = new Logger(VertexAiService.name);
  private readonly auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  constructor(private readonly configService: ConfigService) {}

  private get config(): LocalAgentConfig {
    return this.configService.get<LocalAgentConfig>('localAgent')!;
  }

  getProvider(): AgentProvider {
    return this.config.provider;
  }

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const provider = this.config.provider;

    if (provider === 'mock') {
      return this.generateMock(messages, options);
    }

    if (provider === 'gemini-api') {
      return this.generateGeminiApi(messages, options);
    }

    return this.generateVertex(messages, options);
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const provider = this.config.provider;

    if (provider === 'mock') {
      return {
        values: this.localHashEmbedding(text),
        model: 'local-hash-embedding',
        provider: 'mock',
      };
    }

    if (provider === 'gemini-api') {
      return this.embedGeminiApi(text);
    }

    return this.embedVertex(text);
  }

  private async generateVertex(
    messages: ChatMessage[],
    options: GenerateOptions,
  ): Promise<GenerateResult> {
    const { projectId, location, chatModel, temperature, maxOutputTokens } = this.config;
    if (!projectId) {
      this.logger.warn('GCP_PROJECT_ID missing; falling back to mock generation');
      return this.generateMock(messages, options);
    }

    const systemInstruction =
      options.systemInstruction ||
      messages.find((m) => m.role === 'system')?.content ||
      '';
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url =
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}` +
      `/locations/${location}/publishers/google/models/${chatModel}:generateContent`;

    const token = await this.getAccessToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        contents,
        generationConfig: {
          temperature: options.temperature ?? temperature,
          maxOutputTokens: options.maxOutputTokens ?? maxOutputTokens,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Vertex generate failed: ${response.status} ${body}`);
      throw new Error(`Vertex AI generate failed (${response.status})`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ||
      '';

    return {
      text,
      model: chatModel,
      provider: 'vertex',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        candidatesTokens: data.usageMetadata?.candidatesTokenCount,
        totalTokens: data.usageMetadata?.totalTokenCount,
      },
      raw: data,
    };
  }

  private async embedVertex(text: string): Promise<EmbeddingResult> {
    const { projectId, location, embeddingModel } = this.config;
    if (!projectId) {
      return {
        values: this.localHashEmbedding(text),
        model: 'local-hash-embedding',
        provider: 'mock',
      };
    }

    const url =
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}` +
      `/locations/${location}/publishers/google/models/${embeddingModel}:predict`;

    const token = await this.getAccessToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ content: text }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Vertex embed failed: ${response.status} ${body}`);
      throw new Error(`Vertex AI embed failed (${response.status})`);
    }

    const data = (await response.json()) as {
      predictions?: Array<{ embeddings?: { values?: number[] }; values?: number[] }>;
    };
    const values =
      data.predictions?.[0]?.embeddings?.values ||
      data.predictions?.[0]?.values ||
      [];

    return { values, model: embeddingModel, provider: 'vertex' };
  }

  private async generateGeminiApi(
    messages: ChatMessage[],
    options: GenerateOptions,
  ): Promise<GenerateResult> {
    const apiKey = this.config.geminiApiKey;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY missing; falling back to mock generation');
      return this.generateMock(messages, options);
    }

    const model = this.config.chatModel.replace(/-001$/, '') || 'gemini-2.0-flash';
    const systemInstruction =
      options.systemInstruction ||
      messages.find((m) => m.role === 'system')?.content ||
      '';
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        contents,
        generationConfig: {
          temperature: options.temperature ?? this.config.temperature,
          maxOutputTokens: options.maxOutputTokens ?? this.config.maxOutputTokens,
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API generate failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ||
      '';

    return { text, model, provider: 'gemini-api', raw: data };
  }

  private async embedGeminiApi(text: string): Promise<EmbeddingResult> {
    const apiKey = this.config.geminiApiKey;
    if (!apiKey) {
      return {
        values: this.localHashEmbedding(text),
        model: 'local-hash-embedding',
        provider: 'mock',
      };
    }

    const model = this.config.embeddingModel || 'text-embedding-004';
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent` +
      `?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API embed failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };

    return {
      values: data.embedding?.values || [],
      model,
      provider: 'gemini-api',
    };
  }

  private generateMock(
    messages: ChatMessage[],
    options: GenerateOptions,
  ): GenerateResult {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const tools = options.toolsHint?.length
      ? `\nAvailable tools noted: ${options.toolsHint.join(', ')}.`
      : '';
    const text =
      `[mock/${this.config.chatModel}] Acknowledged.\n` +
      `Context: ${(options.systemInstruction || '').slice(0, 120)}...\n` +
      `You said: "${lastUser?.content || ''}"\n` +
      `Next: I can store memories, create tasks, draft marketing, or queue builds when enabled.${tools}`;

    return {
      text,
      model: 'mock-local-agent',
      provider: 'mock',
    };
  }

  /** Deterministic lightweight embedding for local/dev cosine search. */
  localHashEmbedding(text: string, dims = 64): number[] {
    const values = new Array(dims).fill(0);
    const normalized = text.toLowerCase();
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      values[i % dims] += ((code * (i + 1)) % 97) / 97;
    }
    const magnitude = Math.sqrt(values.reduce((s, v) => s + v * v, 0)) || 1;
    return values.map((v) => v / magnitude);
  }

  private async getAccessToken(): Promise<string> {
    if (process.env.GCP_ACCESS_TOKEN) {
      return process.env.GCP_ACCESS_TOKEN;
    }
    const client = await this.auth.getClient();
    const tokenResponse = await client.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Unable to obtain GCP access token for Vertex AI');
    }
    return tokenResponse.token;
  }
}

import { LLMModel } from '@/types';
import {
  BaseLLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from './base';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { GoogleProvider } from './providers/google';
import { XAIProvider } from './providers/xai';
import { DeepSeekProvider } from './providers/deepseek';

export class LLMManager {
  private providers: Map<LLMModel, BaseLLMProvider> = new Map();

  constructor(apiKeys: Partial<Record<LLMModel, string>>) {
    if (apiKeys['gpt-5']) {
      this.providers.set('gpt-5', new OpenAIProvider(apiKeys['gpt-5']));
    }
    if (apiKeys['claude-4']) {
      this.providers.set(
        'claude-4',
        new AnthropicProvider(apiKeys['claude-4'])
      );
    }
    if (apiKeys['gemini-2.5-flash']) {
      this.providers.set(
        'gemini-2.5-flash',
        new GoogleProvider(apiKeys['gemini-2.5-flash'])
      );
    }
    if (apiKeys['grok-4']) {
      this.providers.set('grok-4', new XAIProvider(apiKeys['grok-4']));
    }
    if (apiKeys['deepseek']) {
      this.providers.set('deepseek', new DeepSeekProvider(apiKeys['deepseek']));
    }
  }

  async generateResponses(
    models: LLMModel[],
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<LLMResponse[]> {
    const promises = models.map(async (model) => {
      const provider = this.providers.get(model);
      if (!provider) {
        return {
          model,
          content: '',
          error: `No API key configured for ${model}`,
        };
      }

      return provider.generateResponse({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 512,
      });
    });

    return Promise.all(promises);
  }

  // Streaming disabled: keep method for compatibility but yield nothing
  async *generateStreamResponses(
    _models: LLMModel[],
    _messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    return;
  }

  hasProvider(model: LLMModel): boolean {
    return this.providers.has(model);
  }

  getAvailableModels(): LLMModel[] {
    return Array.from(this.providers.keys());
  }
}

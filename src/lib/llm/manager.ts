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

  async *generateStreamResponses(
    models: LLMModel[],
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const nonStreamingModels = new Set<LLMModel>(['gemini-2.5-flash']); // Models that don't support streaming
    const completedModels = new Set<LLMModel>();
    
    // Handle non-streaming models first
    const nonStreamingPromises = models
      .filter(model => nonStreamingModels.has(model))
      .map(async (model) => {
        const provider = this.providers.get(model);
        if (!provider) {
          return {
            model,
            content: '',
            done: true,
            error: `No API key configured for ${model}`,
          };
        }

        try {
          const response = await provider.generateResponse({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 2000,
          });
          
          return {
            model,
            content: response.content,
            done: true,
            usage: response.usage,
            error: response.error,
          };
        } catch (error) {
          return {
            model,
            content: '',
            done: true,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

    // Handle streaming models
    const streamingModels = models.filter(model => !nonStreamingModels.has(model));
    const streamingGenerators = new Map<LLMModel, AsyncGenerator<LLMStreamChunk, void, unknown>>();
    
    for (const model of streamingModels) {
      const provider = this.providers.get(model);
      if (!provider) {
        // Handle missing provider immediately
        yield {
          model,
          content: '',
          done: true,
          error: `No API key configured for ${model}`,
        };
        completedModels.add(model);
        continue;
      }

      try {
        const generator = provider.generateStreamResponse({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 512,
          stream: true,
        });
        streamingGenerators.set(model, generator);
      } catch (error) {
        yield {
          model,
          content: '',
          done: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        completedModels.add(model);
      }
    }

    // Yield non-streaming results as they complete
    const nonStreamingResults = await Promise.allSettled(nonStreamingPromises);
    for (const result of nonStreamingResults) {
      if (result.status === 'fulfilled') {
        yield result.value;
        completedModels.add(result.value.model);
      }
    }

    // Stream from streaming models
    const activeStreamingModels = new Set(streamingGenerators.keys());
    const startTime = Date.now();
    const maxTimeout = 30000; // 30 seconds timeout
    
    while (activeStreamingModels.size > 0) {
      // Check for timeout to prevent infinite loops
      if (Date.now() - startTime > maxTimeout) {
        console.warn('Streaming timeout reached, cleaning up remaining generators');
        for (const model of activeStreamingModels) {
          yield {
            model,
            content: '',
            done: true,
            error: 'Streaming timeout - response took too long',
          };
        }
        break;
      }
      const promises = Array.from(activeStreamingModels).map(async (model) => {
        const generator = streamingGenerators.get(model);
        if (!generator) return null;
        
        try {
          const result = await generator.next();
          return { model, result };
        } catch (error) {
          return {
            model,
            result: {
              done: true,
              value: {
                model,
                content: '',
                done: true,
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            },
          };
        }
      });

      const results = await Promise.allSettled(promises);

      for (const promiseResult of results) {
        if (promiseResult.status === 'fulfilled' && promiseResult.value) {
          const { model, result } = promiseResult.value;

          if (result.done) {
            activeStreamingModels.delete(model);
            completedModels.add(model);
            // Clean up the generator
            streamingGenerators.delete(model);
            if (result.value) {
              yield result.value;
            }
          } else if (result.value) {
            yield result.value;
          }
        }
      }

      // Small delay to prevent overwhelming the system
      if (activeStreamingModels.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Clean up any remaining generators
    streamingGenerators.clear();
  }

  hasProvider(model: LLMModel): boolean {
    return this.providers.has(model);
  }

  getAvailableModels(): LLMModel[] {
    return Array.from(this.providers.keys());
  }
}

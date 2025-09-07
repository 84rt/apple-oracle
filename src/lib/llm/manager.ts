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
        temperature: 0.7,
        max_tokens: 2000,
      });
    });

    return Promise.all(promises);
  }

  async *generateStreamResponses(
    models: LLMModel[],
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const generators = new Map<
      LLMModel,
      AsyncGenerator<LLMStreamChunk, void, unknown>
    >();
    const activeModels = new Set<LLMModel>();
    const nonStreamingModels = new Set<LLMModel>(['gemini-2.5-flash']); // Models that don't support streaming

    // Handle non-streaming models (like Gemini Flash) separately
    for (const model of models) {
      if (nonStreamingModels.has(model)) {
        const provider = this.providers.get(model);
        if (!provider) {
          yield {
            model,
            content: '',
            done: true,
            error: `No API key configured for ${model}`,
          };
          continue;
        }

        // Handle non-streaming response asynchronously
        (async () => {
          try {
            const response = await provider.generateResponse({
              model,
              messages,
              temperature: 0.7,
              max_tokens: 2000,
            });
            
            // Convert regular response to stream chunk format
            setTimeout(() => {
              generators.set(model, (async function*() {
                yield {
                  model,
                  content: response.content,
                  done: true,
                  usage: response.usage,
                  error: response.error,
                };
              })());
            }, 0);
          } catch (error) {
            setTimeout(() => {
              generators.set(model, (async function*() {
                yield {
                  model,
                  content: '',
                  done: true,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              })());
            }, 0);
          }
        })();
        
        continue;
      }

      // Handle streaming models normally
      const provider = this.providers.get(model);
      if (!provider) {
        yield {
          model,
          content: '',
          done: true,
          error: `No API key configured for ${model}`,
        };
        continue;
      }

      const generator = provider.generateStreamResponse({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });
      generators.set(model, generator);
      activeModels.add(model);
    }

    // Stream responses from all models concurrently
    while (activeModels.size > 0 || generators.size > activeModels.size) {
      // Check for new generators from non-streaming models
      const allModelGenerators = Array.from(generators.keys());
      const newGenerators = allModelGenerators.filter(model => 
        !activeModels.has(model) && generators.has(model)
      );
      
      for (const model of newGenerators) {
        activeModels.add(model);
      }
      
      if (activeModels.size === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }

      const promises = Array.from(activeModels).map(async (model) => {
        const generator = generators.get(model);
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
            activeModels.delete(model);
            if (result.value) {
              yield result.value;
            }
          } else if (result.value) {
            yield result.value;
          }
        }
      }

      // Small delay to prevent overwhelming the system
      if (activeModels.size > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  hasProvider(model: LLMModel): boolean {
    return this.providers.has(model);
  }

  getAvailableModels(): LLMModel[] {
    return Array.from(this.providers.keys());
  }
}

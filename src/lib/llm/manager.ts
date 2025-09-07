import { LLMModel } from '@/types'
import { BaseLLMProvider, LLMRequest, LLMResponse } from './base'
import { OpenAIProvider } from './providers/openai'
import { AnthropicProvider } from './providers/anthropic'
import { GoogleProvider } from './providers/google'
import { XAIProvider } from './providers/xai'
import { DeepSeekProvider } from './providers/deepseek'

export class LLMManager {
  private providers: Map<LLMModel, BaseLLMProvider> = new Map()

  constructor(apiKeys: Partial<Record<LLMModel, string>>) {
    if (apiKeys['gpt-5']) {
      this.providers.set('gpt-5', new OpenAIProvider(apiKeys['gpt-5']))
    }
    if (apiKeys['claude-4']) {
      this.providers.set('claude-4', new AnthropicProvider(apiKeys['claude-4']))
    }
    if (apiKeys['gemini-2.5-pro']) {
      this.providers.set('gemini-2.5-pro', new GoogleProvider(apiKeys['gemini-2.5-pro']))
    }
    if (apiKeys['grok-4']) {
      this.providers.set('grok-4', new XAIProvider(apiKeys['grok-4']))
    }
    if (apiKeys['deepseek']) {
      this.providers.set('deepseek', new DeepSeekProvider(apiKeys['deepseek']))
    }
  }

  async generateResponses(
    models: LLMModel[],
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<LLMResponse[]> {
    const promises = models.map(async (model) => {
      const provider = this.providers.get(model)
      if (!provider) {
        return {
          model,
          content: '',
          error: `No API key configured for ${model}`
        }
      }

      return provider.generateResponse({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    return Promise.all(promises)
  }

  hasProvider(model: LLMModel): boolean {
    return this.providers.has(model)
  }

  getAvailableModels(): LLMModel[] {
    return Array.from(this.providers.keys())
  }
}

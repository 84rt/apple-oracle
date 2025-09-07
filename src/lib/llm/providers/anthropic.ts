import { BaseLLMProvider, LLMRequest, LLMResponse } from '../base'
import { LLMModel } from '@/types'

export class AnthropicProvider extends BaseLLMProvider {
  model: LLMModel = 'claude-4'

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022', // Using Claude 3.5 Sonnet as Claude 4 isn't available yet
          max_tokens: request.max_tokens || 2000,
          messages: request.messages.filter(m => m.role !== 'system'),
          system: request.messages.find(m => m.role === 'system')?.content || '',
        }),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        model: this.model,
        content: data.content[0]?.text || '',
        usage: data.usage ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        } : undefined,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
}

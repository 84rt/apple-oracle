import { BaseLLMProvider, LLMRequest, LLMResponse } from '../base'
import { LLMModel } from '@/types'

export class XAIProvider extends BaseLLMProvider {
  model: LLMModel = 'grok-4'

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta', // Using Grok Beta as Grok-4 isn't available yet
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 2000,
        }),
      })

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        model: this.model,
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        } : undefined,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
}

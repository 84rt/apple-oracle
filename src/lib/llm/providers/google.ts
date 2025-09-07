import { BaseLLMProvider, LLMRequest, LLMResponse } from '../base'
import { LLMModel } from '@/types'

export class GoogleProvider extends BaseLLMProvider {
  model: LLMModel = 'gemini-2.5-pro'

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: request.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            temperature: request.temperature || 0.7,
            maxOutputTokens: request.max_tokens || 2000,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Google AI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        model: this.model,
        content: data.candidates[0]?.content?.parts[0]?.text || '',
        usage: data.usageMetadata ? {
          prompt_tokens: data.usageMetadata.promptTokenCount,
          completion_tokens: data.usageMetadata.candidatesTokenCount,
          total_tokens: data.usageMetadata.totalTokenCount,
        } : undefined,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }
}

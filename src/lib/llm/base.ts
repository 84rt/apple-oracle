import { LLMModel } from '@/types'

export interface LLMRequest {
  model: LLMModel
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
}

export interface LLMResponse {
  model: LLMModel
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

export abstract class BaseLLMProvider {
  abstract model: LLMModel
  protected apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  abstract generateResponse(request: LLMRequest): Promise<LLMResponse>

  protected handleError(error: unknown): LLMResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      model: this.model,
      content: '',
      error: errorMessage
    }
  }
}

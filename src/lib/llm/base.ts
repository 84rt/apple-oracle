import { LLMModel } from '@/types'

export interface LLMRequest {
  model: LLMModel
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  stream?: boolean
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

export interface LLMStreamChunk {
  model: LLMModel
  content: string
  done: boolean
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
  abstract generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk, void, unknown>

  protected handleError(error: unknown): LLMResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      model: this.model,
      content: '',
      error: errorMessage
    }
  }

  protected handleStreamError(error: unknown): LLMStreamChunk {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      model: this.model,
      content: '',
      done: true,
      error: errorMessage
    }
  }
}

import { BaseLLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from '../base'
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
        content: data.content?.[0]?.text || '',
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

  async *generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk, void, unknown> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: request.max_tokens || 2000,
          messages: request.messages.filter(m => m.role !== 'system'),
          system: request.messages.find(m => m.role === 'system')?.content || '',
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield this.handleStreamError(new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield this.handleStreamError(new Error('No response body'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed === 'event: ping') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));
              
              if (data.type === 'content_block_delta') {
                const content = data.delta?.text || '';
                yield {
                  model: this.model,
                  content,
                  done: false,
                };
              } else if (data.type === 'message_stop') {
                yield {
                  model: this.model,
                  content: '',
                  done: true,
                  usage: data.usage ? {
                    prompt_tokens: data.usage.input_tokens || 0,
                    completion_tokens: data.usage.output_tokens || 0,
                    total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
                  } : undefined,
                };
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse Anthropic stream chunk:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      yield this.handleStreamError(error);
    }
  }
}

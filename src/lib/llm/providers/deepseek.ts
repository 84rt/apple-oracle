import { BaseLLMProvider, LLMRequest, LLMResponse, LLMStreamChunk } from '../base';
import { LLMModel } from '@/types';

export class DeepSeekProvider extends BaseLLMProvider {
  model: LLMModel = 'deepseek';

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Use the correct model name based on provider configuration
      const modelName = this.model === 'deepseek' ? 'deepseek-chat' : 'deepseek-reasoner';
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: request.messages,
          temperature: request.temperature || 1.0, // Default is 1.0 according to docs
          max_tokens: request.max_tokens || 4096, // Default is 4096 according to docs
        }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      return {
        model: this.model,
        content: data.choices?.[0]?.message?.content || '',
        usage: data.usage ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async *generateStreamResponse(request: LLMRequest): AsyncGenerator<LLMStreamChunk, void, unknown> {
    try {
      const modelName = this.model === 'deepseek' ? 'deepseek-chat' : 'deepseek-reasoner';
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: request.messages,
          temperature: request.temperature || 1.0,
          max_tokens: request.max_tokens || 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield this.handleStreamError(new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`));
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
            if (trimmed === '' || trimmed === 'data: [DONE]') continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));
              const content = data.choices?.[0]?.delta?.content || '';
              const finishReason = data.choices?.[0]?.finish_reason;

              yield {
                model: this.model,
                content,
                done: finishReason === 'stop' || finishReason === 'length',
                usage: data.usage ? {
                  prompt_tokens: data.usage.prompt_tokens || 0,
                  completion_tokens: data.usage.completion_tokens || 0,
                  total_tokens: data.usage.total_tokens || 0,
                } : undefined,
              };

              if (finishReason === 'stop' || finishReason === 'length') {
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse DeepSeek stream chunk:', parseError);
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

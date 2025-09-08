import {
  BaseLLMProvider,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from '../base';
import { LLMModel } from '@/types';

export class GoogleProvider extends BaseLLMProvider {
  model: LLMModel = 'gemini-2.5-flash';

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Use the correct model name in the URL that matches the provider model
      const modelName = this.model;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: request.messages
              .filter((msg) => msg.role !== 'system')
              .map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
              })),
            systemInstruction: request.messages.find(
              (msg) => msg.role === 'system'
            )
              ? {
                  parts: [
                    {
                      text:
                        request.messages.find((msg) => msg.role === 'system')
                          ?.content || '',
                    },
                  ],
                }
              : undefined,
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: request.max_tokens || 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Google AI API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      // Check for API errors in the response body
      if (data.error) {
        throw new Error(`Google AI API error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      // Add debugging for malformed responses
      if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
        console.warn('Google AI API returned no candidates:', data);
        return {
          model: this.model,
          content: '',
          usage: data.usageMetadata
            ? {
                prompt_tokens: data.usageMetadata.promptTokenCount,
                completion_tokens: data.usageMetadata.candidatesTokenCount,
                total_tokens: data.usageMetadata.totalTokenCount,
              }
            : undefined,
        };
      }

      return {
        model: this.model,
        content: data.candidates[0]?.content?.parts?.[0]?.text || '',
        usage: data.usageMetadata
          ? {
              prompt_tokens: data.usageMetadata.promptTokenCount,
              completion_tokens: data.usageMetadata.candidatesTokenCount,
              total_tokens: data.usageMetadata.totalTokenCount,
            }
          : undefined,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async *generateStreamResponse(
    request: LLMRequest
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    try {
      const modelName = this.model;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: request.messages
              .filter((msg) => msg.role !== 'system')
              .map((msg) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
              })),
            systemInstruction: request.messages.find(
              (msg) => msg.role === 'system'
            )
              ? {
                  parts: [
                    {
                      text:
                        request.messages.find((msg) => msg.role === 'system')
                          ?.content || '',
                    },
                  ],
                }
              : undefined,
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: request.max_tokens || 2000,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        yield this.handleStreamError(
          new Error(
            `Google AI API error: ${response.status} ${response.statusText} - ${errorText}`
          )
        );
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
          
          // Google's streaming format uses newline-delimited JSON
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed === 'data: [DONE]') continue;
            
            // Handle both raw JSON and data: prefixed format
            let jsonStr = trimmed;
            if (trimmed.startsWith('data: ')) {
              jsonStr = trimmed.slice(6);
            }
            
            if (!jsonStr.startsWith('{')) continue;

            try {
              const data = JSON.parse(jsonStr);
              
              // Extract content from the response
              const candidate = data.candidates?.[0];
              if (!candidate) {
                console.warn('Google stream chunk has no candidates:', data);
                continue;
              }
              
              const content = candidate.content?.parts?.[0]?.text || '';
              const finishReason = candidate.finishReason;
              const isDone = finishReason === 'STOP' || finishReason === 'MAX_TOKENS' || finishReason === 'FINISH_REASON_STOP';

              // Only yield if there's content or if it's done
              if (content || isDone) {
                yield {
                  model: this.model,
                  content,
                  done: isDone,
                  usage: data.usageMetadata
                    ? {
                        prompt_tokens: data.usageMetadata.promptTokenCount || 0,
                        completion_tokens:
                          data.usageMetadata.candidatesTokenCount || 0,
                        total_tokens: data.usageMetadata.totalTokenCount || 0,
                      }
                    : undefined,
                };
              }

              if (isDone) {
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse Google stream chunk:', parseError, 'Raw line:', trimmed);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Google streaming error:', error);
      yield this.handleStreamError(error);
    }
  }
}

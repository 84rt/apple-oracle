import { NextRequest, NextResponse } from 'next/server';
import { LLMManager } from '@/lib/llm/manager';
import { LLMModel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { messages, models, apiKeys, stream } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'At least one model must be selected' },
        { status: 400 }
      );
    }

    // Use platform API keys as fallback
    const allApiKeys = {
      'gpt-5': apiKeys?.['gpt-5'] || process.env.OPENAI_API_KEY,
      'claude-4': apiKeys?.['claude-4'] || process.env.ANTHROPIC_API_KEY,
      'gemini-2.5-flash':
        apiKeys?.['gemini-2.5-flash'] || process.env.GOOGLE_AI_API_KEY,
      'grok-4': apiKeys?.['grok-4'] || process.env.XAI_API_KEY,
      deepseek: apiKeys?.['deepseek'] || process.env.DEEPSEEK_API_KEY,
    };

    const llmManager = new LLMManager(allApiKeys);

    // Handle streaming responses
    if (stream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of llmManager.generateStreamResponses(
              models as LLMModel[],
              messages
            )) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }

            // Send final done message
            const doneData = `data: [DONE]\n\n`;
            controller.enqueue(encoder.encode(doneData));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = `data: ${JSON.stringify({
              error: 'Streaming error occurred',
              done: true,
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Handle non-streaming responses (fallback)
    const responses = await llmManager.generateResponses(
      models as LLMModel[],
      messages
    );
    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

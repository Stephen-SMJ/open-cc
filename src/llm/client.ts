import OpenAI from 'openai';
import type { ChatCompletionChunk, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions.mjs';

export type LLMEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'done' };

export function createLLMClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey, baseURL });
}

export async function* streamCompletion(
  client: OpenAI,
  options: {
    model: string;
    messages: ChatCompletionMessageParam[];
    system?: string;
    tools?: ChatCompletionTool[];
    maxTokens?: number;
  },
): AsyncGenerator<LLMEvent> {
  const messages: ChatCompletionMessageParam[] = options.system
    ? [{ role: 'system', content: options.system }, ...options.messages]
    : [...options.messages];

  const stream = await client.chat.completions.create({
    model: options.model,
    messages,
    tools: options.tools?.length ? options.tools : undefined,
    max_tokens: options.maxTokens,
    stream: true,
    stream_options: { include_usage: true },
  });

  const buffer: Record<string, { name: string; input: string }> = {};

  for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) {
      yield { type: 'text', text: delta.content };
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const index = tc.index;
        if (!buffer[index]) {
          buffer[index] = { name: tc.function?.name || '', input: '' };
        }
        if (tc.function?.arguments) {
          buffer[index].input += tc.function.arguments;
        }
        // If name arrived in this chunk, capture it
        if (tc.function?.name && !buffer[index].name) {
          buffer[index].name = tc.function.name;
        }
      }
    }

    // Detect completion of tool calls when finish_reason is 'tool_calls'
    const finishReason = chunk.choices?.[0]?.finish_reason;
    if (finishReason === 'tool_calls' || finishReason === 'stop') {
      for (const indexStr of Object.keys(buffer)) {
        const idx = Number(indexStr);
        const { name, input } = buffer[idx];
        yield { type: 'tool_call', id: `call_${idx}`, name, input };
      }
      // Clear buffer after yielding
      for (const k of Object.keys(buffer)) delete buffer[k];
    }

    if (chunk.usage) {
      yield {
        type: 'usage',
        inputTokens: chunk.usage.prompt_tokens || 0,
        outputTokens: chunk.usage.completion_tokens || 0,
      };
    }
  }

  yield { type: 'done' };
}

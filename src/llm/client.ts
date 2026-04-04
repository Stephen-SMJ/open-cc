import OpenAI from 'openai';
import type { ChatCompletionChunk, ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions.mjs';

export type LLMEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_call'; id: string; name: string; input: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'done' };

export function createLLMClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey) throw new Error('OPENAI_API_KEY (or ANTHROPIC_API_KEY as fallback) is not set');
  return new OpenAI({ apiKey, baseURL });
}

function validateMessages(messages: ChatCompletionMessageParam[]) {
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === 'tool' && 'tool_call_id' in m) {
      let found = false;
      for (let j = i - 1; j >= 0; j--) {
        const prev = messages[j];
        if (prev?.role === 'assistant' && 'tool_calls' in prev && Array.isArray(prev.tool_calls)) {
          if (prev.tool_calls.some((tc: any) => tc.id === m.tool_call_id)) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        console.error(
          `[open-cc warn] Message validation at index ${i}: tool_result with tool_call_id "${m.tool_call_id}" does not have a matching assistant tool_use in a preceding message.`,
        );
      }
    }
    if (m.role === 'assistant' && 'tool_calls' in m && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      let j = i + 1;
      let toolCount = 0;
      while (j < messages.length && messages[j].role === 'tool') {
        toolCount++;
        j++;
      }
      if (toolCount !== m.tool_calls.length) {
        console.error(
          `[open-cc warn] Message validation at index ${i}: assistant has ${m.tool_calls.length} tool_calls but ${toolCount} tool_result(s) follow.`,
        );
      }
    }
  }
}

export async function* streamCompletion(
  client: OpenAI,
  options: {
    model: string;
    messages: ChatCompletionMessageParam[];
    system?: string;
    tools?: ChatCompletionTool[];
    maxTokens?: number;
    signal?: AbortSignal;
  },
): AsyncGenerator<LLMEvent> {
  validateMessages(options.messages);
  const messages: ChatCompletionMessageParam[] = options.system
    ? [{ role: 'system', content: options.system }, ...options.messages]
    : [...options.messages];

  const stream = await client.chat.completions.create(
    {
      model: options.model,
      messages,
      tools: options.tools?.length ? options.tools : undefined,
      max_tokens: options.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    },
    { signal: options.signal },
  );

  const buffer: Record<string, { id?: string; name: string; input: string }> = {};

  try {
    for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) {
        yield { type: 'text', text: delta.content };
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index;
          if (!buffer[index]) {
            buffer[index] = { id: tc.id, name: tc.function?.name || '', input: '' };
          }
          if (tc.function?.arguments) {
            buffer[index].input += tc.function.arguments;
          }
          // If name/id arrived in this chunk, capture it
          if (tc.function?.name && !buffer[index].name) {
            buffer[index].name = tc.function.name;
          }
          if (tc.id && !buffer[index].id) {
            buffer[index].id = tc.id;
          }
        }
      }

      // Detect completion of tool calls when finish_reason is 'tool_calls'
      const finishReason = chunk.choices?.[0]?.finish_reason;
      if (finishReason === 'tool_calls' || finishReason === 'stop') {
        for (const indexStr of Object.keys(buffer)) {
          const idx = Number(indexStr);
          const { id, name, input } = buffer[idx];
          yield { type: 'tool_call', id: id || `call_${idx}`, name, input };
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
  } catch (err: any) {
    if (options.signal?.aborted) {
      return;
    }
    throw err;
  }

  yield { type: 'done' };
}

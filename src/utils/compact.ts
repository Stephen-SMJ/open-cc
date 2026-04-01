import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';

const MAX_MESSAGES = 40;
const COMPACT_THRESHOLD = 30;

export function maybeCompact(
  messages: ChatCompletionMessageParam[],
): ChatCompletionMessageParam[] {
  if (messages.length < MAX_MESSAGES) return messages;

  // Simple compaction: summarize the oldest non-system messages into a single summary message
  const system = messages.find((m) => m.role === 'system');
  const toCompact = messages.filter((m) => m.role !== 'system').slice(0, messages.length - COMPACT_THRESHOLD);
  const recent = messages.filter((m) => m.role !== 'system').slice(-COMPACT_THRESHOLD);

  const summaryContent = `<conversation_summary>Previous ${toCompact.length} messages were compacted to save context space.</conversation_summary>`;

  const result: ChatCompletionMessageParam[] = [...recent];
  if (system) result.unshift(system);
  result.splice(1, 0, { role: 'user', content: summaryContent });
  return result;
}

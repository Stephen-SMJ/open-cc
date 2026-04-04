import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';

const MAX_MESSAGES = 40;
const COMPACT_THRESHOLD = 30;

function countToolResults(messages: ChatCompletionMessageParam[], assistantIndex: number) {
  let count = 0;
  for (let i = assistantIndex + 1; i < messages.length; i++) {
    if (messages[i].role === 'tool') count++;
    else break;
  }
  return count;
}

function isCompleteTurnEnd(messages: ChatCompletionMessageParam[], index: number) {
  const m = messages[index];
  if (m.role === 'tool') return true;
  if (m.role === 'assistant') {
    const hasToolCalls = 'tool_calls' in m && Array.isArray(m.tool_calls) && m.tool_calls.length > 0;
    if (!hasToolCalls) return true;
    // Check if all tool results for this assistant are present in the array
    const toolCount = countToolResults(messages, index);
    return toolCount === (m as any).tool_calls.length;
  }
  return m.role === 'user';
}

export function maybeCompact(
  messages: ChatCompletionMessageParam[],
): ChatCompletionMessageParam[] {
  if (messages.length < MAX_MESSAGES) return messages;

  const system = messages.find((m) => m.role === 'system');
  const nonSystem = messages.filter((m) => m.role !== 'system');

  // Find a safe split point such that everything after it forms complete turns
  let splitIndex = nonSystem.length - COMPACT_THRESHOLD;
  while (splitIndex > 0 && !isCompleteTurnEnd(nonSystem, splitIndex - 1)) {
    splitIndex--;
  }

  let recent = nonSystem.slice(splitIndex);
  const toCompact = nonSystem.slice(0, splitIndex);

  // Ensure recent does not start with a dangling tool result
  while (recent.length > 0 && recent[0].role === 'tool') {
    recent.shift();
  }

  const summaryContent = `<conversation_summary>Previous ${toCompact.length} messages were compacted to save context space.</conversation_summary>`;

  const result: ChatCompletionMessageParam[] = [...recent];
  if (system) result.unshift(system);
  result.splice(1, 0, { role: 'user', content: summaryContent });
  return result;
}

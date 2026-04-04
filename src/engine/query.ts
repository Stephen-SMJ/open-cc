import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';
import { createLLMClient, streamCompletion } from '../llm/client.js';
import { findTool, getTools, toOpenAITools } from '../tools/registry.js';
import type { AnyTool } from '../tools/base.js';
import { PermissionChecker } from '../permissions/checker.js';
import { maybeCompact } from '../utils/compact.js';
import { buildSystemPrompt, type Guide } from '../guides/loader.js';
import { TodoStore } from '../todos/store.js';
import { makeTodoTools } from '../tools/todo.js';
import { z } from 'zod';

export type EngineEvent =
  | { type: 'text'; text: string }
  | { type: 'waiting'; toolName: string }
  | { type: 'tool_result'; toolName: string; result: string; isError: boolean; toolCallId: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'todos_changed' };

export type EngineOptions = {
  model: string;
  systemPrompt?: string;
  maxTokens?: number;
  cwd: string;
  permissionChecker?: PermissionChecker;
  onPermissionRequest?: (tool: AnyTool, input: unknown) => Promise<boolean>;
  guides?: Guide[];
  todoStore?: TodoStore;
};

function trimIncompleteTurn(messages: ChatCompletionMessageParam[]) {
  // Remove leading tool messages (conversation cannot start with a tool result)
  while (messages.length > 0 && messages[0].role === 'tool') {
    messages.shift();
  }

  // Repeatedly remove trailing incomplete turns until stable
  let changed = true;
  while (changed && messages.length > 0) {
    changed = false;

    // Count trailing tool messages
    let toolCount = 0;
    while (toolCount < messages.length && messages[messages.length - 1 - toolCount].role === 'tool') {
      toolCount++;
    }

    const assistantIndex = messages.length - 1 - toolCount;
    const assistant = messages[assistantIndex];
    const isAssistantWithTools =
      assistant?.role === 'assistant' &&
      'tool_calls' in assistant &&
      Array.isArray((assistant as any).tool_calls) &&
      (assistant as any).tool_calls.length > 0;

    if (isAssistantWithTools) {
      const expectedTools = (assistant as any).tool_calls.length;
      if (toolCount < expectedTools) {
        for (let i = 0; i < toolCount; i++) messages.pop();
        messages.pop();
        changed = true;
      }
    } else if (toolCount > 0) {
      for (let i = 0; i < toolCount; i++) messages.pop();
      changed = true;
    } else if (
      messages.length > 0 &&
      messages[messages.length - 1].role === 'assistant' &&
      'tool_calls' in messages[messages.length - 1] &&
      Array.isArray((messages[messages.length - 1] as any).tool_calls) &&
      (messages[messages.length - 1] as any).tool_calls.length > 0
    ) {
      // Trailing assistant with tool_calls but zero tools after it
      messages.pop();
      changed = true;
    }
  }

  return messages;
}

export class Engine {
  private client = createLLMClient();
  private messages: ChatCompletionMessageParam[] = [];
  private options: EngineOptions;
  private abortController = new AbortController();
  private currentTurnAborted = false;
  private todoTools: AnyTool[] = [];

  constructor(options: EngineOptions) {
    this.options = options;
    if (options.todoStore) {
      this.todoTools = Object.values(makeTodoTools(options.todoStore));
    }
  }

  setMessages(messages: ChatCompletionMessageParam[]) {
    this.messages = trimIncompleteTurn([...messages]);
  }

  getMessages(): ChatCompletionMessageParam[] {
    return this.messages;
  }

  abort() {
    this.currentTurnAborted = true;
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async *submit(userInput: string): AsyncGenerator<EngineEvent> {
    this.currentTurnAborted = false;
    this.messages = trimIncompleteTurn(this.messages);
    this.messages.push({ role: 'user', content: userInput });
    const turnStartIndex = this.messages.length;

    try {
      while (true) {
        if (this.currentTurnAborted) break;

        const compacted = maybeCompact(this.messages);
        const tools = toOpenAITools(this.todoTools);

        const systemPrompt = buildSystemPrompt(
          this.options.systemPrompt || '',
          this.options.guides || [],
        );

        const stream = streamCompletion(this.client, {
          model: this.options.model,
          messages: compacted,
          system: systemPrompt,
          tools: tools.length ? tools : undefined,
          maxTokens: this.options.maxTokens,
          signal: this.abortController.signal,
        });

        let assistantText = '';
        const toolCalls: { id: string; name: string; input: string }[] = [];

        for await (const event of stream) {
          if (this.currentTurnAborted) break;

          if (event.type === 'text') {
            assistantText += event.text;
            yield { type: 'text', text: event.text };
          } else if (event.type === 'tool_call') {
            toolCalls.push({ id: event.id, name: event.name, input: event.input });
          } else if (event.type === 'usage') {
            yield { type: 'usage', inputTokens: event.inputTokens, outputTokens: event.outputTokens };
          }
        }

        // Append assistant message
        const assistantMessage: ChatCompletionMessageParam =
          toolCalls.length > 0
            ? {
                role: 'assistant',
                content: assistantText || null,
                tool_calls: toolCalls.map((tc) => ({
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.name, arguments: tc.input },
                })),
              }
            : { role: 'assistant', content: assistantText };
        this.messages.push(assistantMessage);

        if (toolCalls.length === 0 || this.currentTurnAborted) {
          break;
        }

        // Execute tools
        for (const tc of toolCalls) {
          if (this.currentTurnAborted) break;
          const tool = findTool(tc.name, this.todoTools);
          if (!tool) {
            const err = `Tool ${tc.name} not found`;
            this.messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: err,
            });
            yield { type: 'tool_result', toolName: tc.name, result: err, isError: true, toolCallId: tc.id };
            continue;
          }

          let parsedInput: any;
          try {
            parsedInput = tool.inputSchema.parse(JSON.parse(tc.input));
          } catch (e: any) {
            const err = `Invalid input: ${e.message}`;
            this.messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: err,
            });
            yield { type: 'tool_result', toolName: tc.name, result: err, isError: true, toolCallId: tc.id };
            continue;
          }

          // Permission check
          const checker = this.options.permissionChecker;
          if (checker && !checker.canAutoApprove(tool)) {
            const allowed = this.options.onPermissionRequest
              ? await this.options.onPermissionRequest(tool, parsedInput)
              : false;
            if (!allowed) {
              const msg = `Permission denied for ${tc.name}`;
              this.messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: msg,
              });
              yield { type: 'tool_result', toolName: tc.name, result: msg, isError: true, toolCallId: tc.id };
              continue;
            }
          }

          yield { type: 'waiting', toolName: tc.name };

          const context = { cwd: this.options.cwd, abortSignal: this.abortController.signal };
          const generator = tool.execute(parsedInput, context);
          let result = await generator.next();
          while (!result.done) {
            result = await generator.next();
          }
          const toolResult = result.value;

          this.messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolResult.content,
          });
          yield {
            type: 'tool_result',
            toolName: tc.name,
            result: toolResult.content,
            isError: !!toolResult.isError,
            toolCallId: tc.id,
          };

          if (tc.name === 'TodoListCreate' || tc.name === 'TodoListUpdate') {
            yield { type: 'todos_changed' };
          }
        }

        if (this.currentTurnAborted) break;
        // Loop continues to send tool results back to model
      }
    } finally {
      if (this.currentTurnAborted) {
        this.messages = this.messages.slice(0, turnStartIndex);
        this.currentTurnAborted = false;
      }
    }
  }
}

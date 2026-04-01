import { createLLMClient, streamCompletion } from '../llm/client.js';
import { findTool, toOpenAITools } from '../tools/registry.js';
import { maybeCompact } from '../utils/compact.js';
export class Engine {
    client = createLLMClient();
    messages = [];
    options;
    abortController = new AbortController();
    currentTurnAborted = false;
    constructor(options) {
        this.options = options;
    }
    setMessages(messages) {
        this.messages = messages;
    }
    getMessages() {
        return this.messages;
    }
    abort() {
        this.currentTurnAborted = true;
        this.abortController.abort();
        this.abortController = new AbortController();
    }
    async *submit(userInput) {
        this.currentTurnAborted = false;
        this.messages.push({ role: 'user', content: userInput });
        while (true) {
            if (this.currentTurnAborted)
                break;
            const compacted = maybeCompact(this.messages);
            const tools = toOpenAITools();
            const stream = streamCompletion(this.client, {
                model: this.options.model,
                messages: compacted,
                system: this.options.systemPrompt,
                tools: tools.length ? tools : undefined,
                maxTokens: this.options.maxTokens,
            });
            let assistantText = '';
            const toolCalls = [];
            for await (const event of stream) {
                if (this.currentTurnAborted)
                    break;
                if (event.type === 'text') {
                    assistantText += event.text;
                    yield { type: 'text', text: event.text };
                }
                else if (event.type === 'tool_call') {
                    toolCalls.push({ id: event.id, name: event.name, input: event.input });
                }
                else if (event.type === 'usage') {
                    yield { type: 'usage', inputTokens: event.inputTokens, outputTokens: event.outputTokens };
                }
            }
            // Append assistant message
            const assistantMessage = toolCalls.length > 0
                ? {
                    role: 'assistant',
                    content: assistantText || null,
                    tool_calls: toolCalls.map((tc, idx) => ({
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
                if (this.currentTurnAborted)
                    break;
                const tool = findTool(tc.name);
                if (!tool) {
                    const err = `Tool ${tc.name} not found`;
                    this.messages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: err,
                    });
                    yield { type: 'tool_result', toolName: tc.name, result: err, isError: true };
                    continue;
                }
                let parsedInput;
                try {
                    parsedInput = tool.inputSchema.parse(JSON.parse(tc.input));
                }
                catch (e) {
                    const err = `Invalid input: ${e.message}`;
                    this.messages.push({
                        role: 'tool',
                        tool_call_id: tc.id,
                        content: err,
                    });
                    yield { type: 'tool_result', toolName: tc.name, result: err, isError: true };
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
                        yield { type: 'tool_result', toolName: tc.name, result: msg, isError: true };
                        continue;
                    }
                }
                yield { type: 'waiting', toolName: tc.name };
                const context = { cwd: this.options.cwd, abortSignal: this.abortController.signal };
                const generator = tool.execute(parsedInput, context);
                let result = await generator.next();
                while (!result.done) {
                    // We don't stream progress to UI for simplicity in this version
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
                };
            }
            if (this.currentTurnAborted)
                break;
            // Loop continues to send tool results back to model
        }
    }
}

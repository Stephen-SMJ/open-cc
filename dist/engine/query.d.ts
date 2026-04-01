import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.mjs';
import type { AnyTool } from '../tools/base.js';
import { PermissionChecker } from '../permissions/checker.js';
export type EngineEvent = {
    type: 'text';
    text: string;
} | {
    type: 'waiting';
    toolName: string;
} | {
    type: 'tool_result';
    toolName: string;
    result: string;
    isError: boolean;
} | {
    type: 'usage';
    inputTokens: number;
    outputTokens: number;
};
export type EngineOptions = {
    model: string;
    systemPrompt?: string;
    maxTokens?: number;
    cwd: string;
    permissionChecker?: PermissionChecker;
    onPermissionRequest?: (tool: AnyTool, input: unknown) => Promise<boolean>;
};
export declare class Engine {
    private client;
    private messages;
    private options;
    private abortController;
    private currentTurnAborted;
    constructor(options: EngineOptions);
    setMessages(messages: ChatCompletionMessageParam[]): void;
    getMessages(): ChatCompletionMessageParam[];
    abort(): void;
    submit(userInput: string): AsyncGenerator<EngineEvent>;
}

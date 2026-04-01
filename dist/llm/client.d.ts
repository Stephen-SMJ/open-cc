import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions.mjs';
export type LLMEvent = {
    type: 'text';
    text: string;
} | {
    type: 'tool_call';
    id: string;
    name: string;
    input: string;
} | {
    type: 'usage';
    inputTokens: number;
    outputTokens: number;
} | {
    type: 'done';
};
export declare function createLLMClient(): OpenAI;
export declare function streamCompletion(client: OpenAI, options: {
    model: string;
    messages: ChatCompletionMessageParam[];
    system?: string;
    tools?: ChatCompletionTool[];
    maxTokens?: number;
}): AsyncGenerator<LLMEvent>;

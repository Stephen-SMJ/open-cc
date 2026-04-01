import { z } from 'zod';

export type ToolProgress =
  | { type: 'text'; text: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number };

export type ToolResult = {
  content: string;
  isError?: boolean;
};

export type ToolContext = {
  cwd: string;
  abortSignal?: AbortSignal;
};

export type ToolDef<TInput extends z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: TInput;
  isReadOnly: boolean;
  isEnabled?: () => boolean;
  execute: (
    input: z.infer<TInput>,
    context: ToolContext,
  ) => AsyncGenerator<ToolProgress, ToolResult, unknown>;
};

export type AnyTool = ToolDef<any>;

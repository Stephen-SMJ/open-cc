import { z } from 'zod';
import type { ToolDef } from './base.js';
declare const schema: z.ZodObject<{
    command: z.ZodString;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    command: string;
    timeout?: number | undefined;
}, {
    command: string;
    timeout?: number | undefined;
}>;
export declare const BashTool: ToolDef<typeof schema>;
export {};

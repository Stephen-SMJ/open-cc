import { z } from 'zod';
import type { ToolDef } from './base.js';
declare const schema: z.ZodObject<{
    pattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pattern: string;
}, {
    pattern: string;
}>;
export declare const GlobTool: ToolDef<typeof schema>;
export {};

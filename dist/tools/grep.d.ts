import { z } from 'zod';
import type { ToolDef } from './base.js';
declare const schema: z.ZodObject<{
    pattern: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    case_insensitive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    path?: string | undefined;
    case_insensitive?: boolean | undefined;
}, {
    pattern: string;
    path?: string | undefined;
    case_insensitive?: boolean | undefined;
}>;
export declare const GrepTool: ToolDef<typeof schema>;
export {};

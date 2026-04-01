import { z } from 'zod';
import type { ToolDef } from './base.js';
declare const schema: z.ZodObject<{
    file_path: z.ZodString;
    offset: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    file_path: string;
    offset?: number | undefined;
    limit?: number | undefined;
}, {
    file_path: string;
    offset?: number | undefined;
    limit?: number | undefined;
}>;
export declare const ReadTool: ToolDef<typeof schema>;
export {};

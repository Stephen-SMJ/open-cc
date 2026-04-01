import { z } from 'zod';
import type { ToolDef } from './base.js';
declare const schema: z.ZodObject<{
    file_path: z.ZodString;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file_path: string;
    content: string;
}, {
    file_path: string;
    content: string;
}>;
export declare const WriteTool: ToolDef<typeof schema>;
export {};

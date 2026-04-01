import { z } from 'zod';
import type { ToolDef } from './base.js';
declare const schema: z.ZodObject<{
    file_path: z.ZodString;
    old_string: z.ZodString;
    new_string: z.ZodString;
    replace_all: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean | undefined;
}, {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean | undefined;
}>;
export declare const EditTool: ToolDef<typeof schema>;
export {};

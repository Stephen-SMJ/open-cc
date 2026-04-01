import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
const schema = z.object({
    file_path: z.string(),
    offset: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
});
export const ReadTool = {
    name: 'Read',
    description: 'Read the contents of a file. Optionally specify offset (1-based) and limit for partial reads.',
    inputSchema: schema,
    isReadOnly: true,
    async *execute(input, context) {
        const fp = resolve(context.cwd, input.file_path);
        if (!existsSync(fp)) {
            return { content: `Error: file not found: ${input.file_path}`, isError: true };
        }
        let content = readFileSync(fp, 'utf-8');
        const lines = content.split('\n');
        const offset = input.offset ?? 1;
        const limit = input.limit ?? lines.length;
        const sliced = lines.slice(offset - 1, offset - 1 + limit);
        const numbered = sliced.map((l, i) => `${offset + i} ${l}`).join('\n');
        return { content: numbered };
    },
};

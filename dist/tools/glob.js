import { z } from 'zod';
import { simpleGlob } from '../utils/glob.js';
const schema = z.object({
    pattern: z.string(),
});
export const GlobTool = {
    name: 'Glob',
    description: 'Find files matching a glob pattern like "**/*.ts" or "src/**/*.json".',
    inputSchema: schema,
    isReadOnly: true,
    async *execute(input, context) {
        const files = simpleGlob(input.pattern, context.cwd);
        if (files.length === 0) {
            return { content: 'No files matched the pattern.' };
        }
        return { content: files.join('\n') };
    },
};

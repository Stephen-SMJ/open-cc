import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';
const schema = z.object({
    file_path: z.string(),
    old_string: z.string(),
    new_string: z.string(),
    replace_all: z.coerce.boolean().optional(),
});
export const EditTool = {
    name: 'Edit',
    description: 'Replace a unique string in a file with a new string. If replace_all is true, replaces all occurrences.',
    inputSchema: schema,
    isReadOnly: false,
    async *execute(input, context) {
        const fp = resolve(context.cwd, input.file_path);
        const content = readFileSync(fp, 'utf-8');
        const count = content.split(input.old_string).length - 1;
        if (count === 0) {
            return { content: `Error: old_string not found in ${input.file_path}`, isError: true };
        }
        if (!input.replace_all && count > 1) {
            return { content: `Error: old_string is not unique (${count} occurrences). Use replace_all to replace all.`, isError: true };
        }
        const newContent = content.split(input.old_string).join(input.new_string);
        writeFileSync(fp, newContent, 'utf-8');
        return { content: `Edited ${input.file_path} (${input.replace_all ? count : 1} replacement${input.replace_all && count > 1 ? 's' : ''})` };
    },
};

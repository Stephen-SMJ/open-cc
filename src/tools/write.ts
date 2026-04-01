import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { z } from 'zod';
import type { ToolDef } from './base.js';

const schema = z.object({
  file_path: z.string(),
  content: z.string(),
});

export const WriteTool: ToolDef<typeof schema> = {
  name: 'Write',
  description: 'Write content to a file. Creates parent directories if needed.',
  inputSchema: schema,
  isReadOnly: false,
  async *execute(input, context) {
    const fp = resolve(context.cwd, input.file_path);
    mkdirSync(dirname(fp), { recursive: true });
    writeFileSync(fp, input.content, 'utf-8');
    return { content: `Wrote ${Buffer.byteLength(input.content)} bytes to ${input.file_path}` };
  },
};

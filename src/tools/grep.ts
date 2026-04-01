import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { z } from 'zod';
import type { ToolDef } from './base.js';

const schema = z.object({
  pattern: z.string(),
  path: z.string().optional(),
  case_insensitive: z.coerce.boolean().optional(),
});

function searchDir(dir: string, regex: RegExp, results: string[], max = 50) {
  if (results.length >= max) return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (results.length >= max) break;
      if (entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        searchDir(full, regex, results, max);
      } else {
        try {
          const content = readFileSync(full, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              const rel = full;
              results.push(`${rel}:${i + 1}: ${lines[i].trim()}`);
              if (results.length >= max) break;
            }
          }
        } catch {
          // skip binary or unreadable
        }
      }
    }
  } catch {
    // ignore
  }
}

export const GrepTool: ToolDef<typeof schema> = {
  name: 'Grep',
  description: 'Search for a regex pattern in file contents. Optionally limit to a specific path.',
  inputSchema: schema,
  isReadOnly: true,
  async *execute(input, context) {
    const flags = input.case_insensitive ? 'i' : '';
    let regex: RegExp;
    try {
      regex = new RegExp(input.pattern, flags);
    } catch {
      return { content: 'Error: invalid regex pattern', isError: true };
    }

    const results: string[] = [];
    const target = input.path ? resolve(context.cwd, input.path) : context.cwd;
    if (existsSync(target) && statSync(target).isFile()) {
      const content = readFileSync(target, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push(`${target}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    } else {
      searchDir(target, regex, results, 50);
    }

    if (results.length === 0) {
      return { content: 'No matches found.' };
    }
    if (results.length >= 50) {
      return { content: results.join('\n') + '\n\n(Results truncated to 50 matches)' };
    }
    return { content: results.join('\n') };
  },
};

import { spawn } from 'child_process';
import { z } from 'zod';
import type { ToolDef } from './base.js';

const schema = z.object({
  command: z.string(),
  timeout: z.coerce.number().optional(),
});

export const BashTool: ToolDef<typeof schema> = {
  name: 'Bash',
  description: 'Run a shell command in the working directory. Set timeout in milliseconds.',
  inputSchema: schema,
  isReadOnly: false,
  async *execute(input, context) {
    return new Promise((resolve) => {
      const timeout = input.timeout ?? 60_000;
      const child = spawn('bash', ['-c', input.command], {
        cwd: context.cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const output = stdout + (stderr ? `\n--- stderr ---\n${stderr}` : '');
        if (killed) {
          resolve({ content: `Error: command timed out after ${timeout}ms\n${output}`, isError: true });
        } else if (code !== 0) {
          resolve({ content: `Error: exit code ${code}\n${output}`, isError: true });
        } else {
          resolve({ content: output.trim() || '(no output)' });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({ content: `Error: ${err.message}`, isError: true });
      });
    });
  },
};

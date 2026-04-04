import { zodToJsonSchema } from 'zod-to-json-schema';
import type { AnyTool } from './base.js';
import { ReadTool } from './read.js';
import { GlobTool } from './glob.js';
import { GrepTool } from './grep.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { BashTool } from './bash.js';

const ALL_TOOLS: AnyTool[] = [ReadTool, GlobTool, GrepTool, WriteTool, EditTool, BashTool];

export function getTools(extraTools: AnyTool[] = []): AnyTool[] {
  const base = ALL_TOOLS.filter((t) => (t.isEnabled ? t.isEnabled() : true));
  return [...base, ...extraTools];
}

export function findTool(name: string, extraTools: AnyTool[] = []): AnyTool | undefined {
  return getTools(extraTools).find((t) => t.name === name);
}

export function toOpenAITools(extraTools: AnyTool[] = []): any[] {
  return getTools(extraTools).map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: schemaToJsonSchema(t.inputSchema),
    },
  }));
}

function schemaToJsonSchema(zodSchema: any): any {
  return zodToJsonSchema(zodSchema, { target: 'openApi3' });
}

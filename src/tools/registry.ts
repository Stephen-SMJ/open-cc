import type { AnyTool } from './base.js';
import { ReadTool } from './read.js';
import { GlobTool } from './glob.js';
import { GrepTool } from './grep.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { BashTool } from './bash.js';

const ALL_TOOLS: AnyTool[] = [ReadTool, GlobTool, GrepTool, WriteTool, EditTool, BashTool];

export function getTools(): AnyTool[] {
  return ALL_TOOLS.filter((t) => (t.isEnabled ? t.isEnabled() : true));
}

export function findTool(name: string): AnyTool | undefined {
  return getTools().find((t) => t.name === name);
}

export function toOpenAITools(): any[] {
  return getTools().map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(t.inputSchema),
    },
  }));
}

function zodToJsonSchema(zodSchema: any): any {
  // Lightweight zod->JSON schema conversion for OpenAI
  // For our simple schemas, we can just rely on zod's describe if available,
  // but here we build a minimal object schema manually or use the shape.
  const shape = zodSchema.shape || zodSchema._def?.shape?.();
  if (!shape) return { type: 'object', properties: {} };

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const z = value as any;
    const def = z._def || z;
    let type = 'string';
    if (def.typeName === 'ZodNumber' || def.innerType?._def?.typeName === 'ZodNumber') type = 'number';
    if (def.typeName === 'ZodBoolean' || def.innerType?._def?.typeName === 'ZodBoolean') type = 'boolean';

    properties[key] = { type };
    if (def.description) properties[key].description = def.description;
    if (!z.isOptional || !z.isOptional()) required.push(key);
  }

  return { type: 'object', properties, required };
}

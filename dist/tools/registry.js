import { ReadTool } from './read.js';
import { GlobTool } from './glob.js';
import { GrepTool } from './grep.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { BashTool } from './bash.js';
const ALL_TOOLS = [ReadTool, GlobTool, GrepTool, WriteTool, EditTool, BashTool];
export function getTools() {
    return ALL_TOOLS.filter((t) => (t.isEnabled ? t.isEnabled() : true));
}
export function findTool(name) {
    return getTools().find((t) => t.name === name);
}
export function toOpenAITools() {
    return getTools().map((t) => ({
        type: 'function',
        function: {
            name: t.name,
            description: t.description,
            parameters: zodToJsonSchema(t.inputSchema),
        },
    }));
}
function zodToJsonSchema(zodSchema) {
    // Lightweight zod->JSON schema conversion for OpenAI
    // For our simple schemas, we can just rely on zod's describe if available,
    // but here we build a minimal object schema manually or use the shape.
    const shape = zodSchema.shape || zodSchema._def?.shape?.();
    if (!shape)
        return { type: 'object', properties: {} };
    const properties = {};
    const required = [];
    for (const [key, value] of Object.entries(shape)) {
        const z = value;
        const def = z._def || z;
        let type = 'string';
        if (def.typeName === 'ZodNumber' || def.innerType?._def?.typeName === 'ZodNumber')
            type = 'number';
        if (def.typeName === 'ZodBoolean' || def.innerType?._def?.typeName === 'ZodBoolean')
            type = 'boolean';
        properties[key] = { type };
        if (def.description)
            properties[key].description = def.description;
        if (!z.isOptional || !z.isOptional())
            required.push(key);
    }
    return { type: 'object', properties, required };
}

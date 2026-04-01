import type { AnyTool } from './base.js';
export declare function getTools(): AnyTool[];
export declare function findTool(name: string): AnyTool | undefined;
export declare function toOpenAITools(): any[];

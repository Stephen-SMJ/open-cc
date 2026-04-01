import type { AnyTool } from '../tools/base.js';
export type PermissionMode = 'default' | 'auto';
export declare class PermissionChecker {
    mode: PermissionMode;
    private alwaysAllow;
    setMode(mode: PermissionMode): void;
    canAutoApprove(tool: AnyTool): boolean;
    approveForSession(toolName: string): void;
    reset(): void;
}

import type { AnyTool } from '../tools/base.js';

export type PermissionMode = 'default' | 'auto';

export class PermissionChecker {
  mode: PermissionMode = 'default';
  private alwaysAllow = new Set<string>();

  setMode(mode: PermissionMode) {
    this.mode = mode;
  }

  canAutoApprove(tool: AnyTool): boolean {
    if (this.mode === 'auto') return true;
    if (tool.isReadOnly) return true;
    if (this.alwaysAllow.has(tool.name)) return true;
    return false;
  }

  approveForSession(toolName: string) {
    this.alwaysAllow.add(toolName);
  }

  reset() {
    this.alwaysAllow.clear();
  }
}

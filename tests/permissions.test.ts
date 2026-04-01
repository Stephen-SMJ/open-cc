import { describe, it, expect } from 'vitest';
import { PermissionChecker } from '../src/permissions/checker.js';
import { ReadTool, WriteTool, BashTool } from '../src/tools/index.js';

describe('PermissionChecker', () => {
  it('auto-approves read-only tools in default mode', () => {
    const checker = new PermissionChecker();
    expect(checker.canAutoApprove(ReadTool)).toBe(true);
    expect(checker.canAutoApprove(WriteTool)).toBe(false);
    expect(checker.canAutoApprove(BashTool)).toBe(false);
  });

  it('auto-approves everything in auto mode', () => {
    const checker = new PermissionChecker();
    checker.setMode('auto');
    expect(checker.canAutoApprove(ReadTool)).toBe(true);
    expect(checker.canAutoApprove(WriteTool)).toBe(true);
    expect(checker.canAutoApprove(BashTool)).toBe(true);
  });

  it('approves for session after explicit approval', () => {
    const checker = new PermissionChecker();
    checker.approveForSession('Bash');
    expect(checker.canAutoApprove(BashTool)).toBe(true);
    expect(checker.canAutoApprove(WriteTool)).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../src/engine/query.js';
import { PermissionChecker } from '../src/permissions/checker.js';
import * as clientModule from '../src/llm/client.js';

describe('Engine', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('yields text and appends assistant message', async () => {
    vi.spyOn(clientModule, 'createLLMClient').mockReturnValue({} as any);
    vi.spyOn(clientModule, 'streamCompletion').mockImplementation(async function* () {
      yield { type: 'text', text: 'Hello' };
      yield { type: 'done' };
    });

    const engine = new Engine({ model: 'test', cwd: '/tmp' });
    const events: any[] = [];
    for await (const ev of engine.submit('hi')) events.push(ev);

    expect(events.some((e) => e.type === 'text' && e.text === 'Hello')).toBe(true);
    const msgs = engine.getMessages();
    expect(msgs[msgs.length - 1].role).toBe('assistant');
  });

  it('handles tool call execution and loops back', async () => {
    let callCount = 0;
    vi.spyOn(clientModule, 'createLLMClient').mockReturnValue({} as any);
    vi.spyOn(clientModule, 'streamCompletion').mockImplementation(async function* () {
      callCount++;
      if (callCount === 1) {
        yield { type: 'tool_call', id: 'c1', name: 'Glob', input: '{"pattern":"*.txt"}' };
        yield { type: 'done' };
      } else {
        yield { type: 'text', text: 'Done' };
        yield { type: 'done' };
      }
    });

    const checker = new PermissionChecker();
    checker.setMode('auto');
    const engine = new Engine({ model: 'test', cwd: process.cwd(), permissionChecker: checker });
    const events: any[] = [];
    for await (const ev of engine.submit('find txt files')) events.push(ev);

    expect(events.some((e) => e.type === 'waiting' && e.toolName === 'Glob')).toBe(true);
    expect(events.some((e) => e.type === 'text' && e.text === 'Done')).toBe(true);
  });

  it('aborts mid-stream', async () => {
    vi.spyOn(clientModule, 'createLLMClient').mockReturnValue({} as any);
    vi.spyOn(clientModule, 'streamCompletion').mockImplementation(async function* () {
      yield { type: 'text', text: 'A' };
      await new Promise((r) => setTimeout(r, 50));
      yield { type: 'text', text: 'B' };
    });

    const engine = new Engine({ model: 'test', cwd: '/tmp' });
    const events: any[] = [];
    setTimeout(() => engine.abort(), 10);
    for await (const ev of engine.submit('hi')) events.push(ev);

    // Should have yielded A but aborted before B
    expect(events.some((e) => e.text === 'A')).toBe(true);
    expect(events.some((e) => e.text === 'B')).toBe(false);
  });
});

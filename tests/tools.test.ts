import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { ReadTool } from '../src/tools/read.js';
import { WriteTool } from '../src/tools/write.js';
import { EditTool } from '../src/tools/edit.js';
import { GlobTool } from '../src/tools/glob.js';
import { GrepTool } from '../src/tools/grep.js';
import { BashTool } from '../src/tools/bash.js';

const cwd = join(tmpdir(), 'open-cc-tools-test-' + Date.now());

async function runTool(tool: any, input: any) {
  const gen = tool.execute(input, { cwd });
  let result = await gen.next();
  while (!result.done) {
    result = await gen.next();
  }
  return result.value;
}

describe('Tools', () => {
  beforeAll(() => {
    mkdirSync(cwd, { recursive: true });
    writeFileSync(join(cwd, 'hello.txt'), 'line1\nline2\nline3\n');
  });

  afterAll(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('Read reads a file with line numbers', async () => {
    const res = await runTool(ReadTool, { file_path: 'hello.txt' });
    expect(res.content).toContain('1 line1');
    expect(res.content).toContain('2 line2');
  });

  it('Read respects offset and limit', async () => {
    const res = await runTool(ReadTool, { file_path: 'hello.txt', offset: 2, limit: 1 });
    expect(res.content).toContain('2 line2');
    expect(res.content).not.toContain('1 line1');
  });

  it('Glob finds files', async () => {
    const res = await runTool(GlobTool, { pattern: '*.txt' });
    expect(res.content).toContain('hello.txt');
  });

  it('Grep finds pattern', async () => {
    const res = await runTool(GrepTool, { pattern: 'line2', path: 'hello.txt' });
    expect(res.content).toContain('line2');
  });

  it('Write writes a new file', async () => {
    const res = await runTool(WriteTool, { file_path: 'new.txt', content: 'world' });
    expect(res.isError).toBeFalsy();
    expect(existsSync(join(cwd, 'new.txt'))).toBe(true);
    expect(readFileSync(join(cwd, 'new.txt'), 'utf-8')).toBe('world');
  });

  it('Edit replaces unique string', async () => {
    writeFileSync(join(cwd, 'edit.txt'), 'hello world');
    const res = await runTool(EditTool, { file_path: 'edit.txt', old_string: 'world', new_string: 'OpenCC' });
    expect(res.isError).toBeFalsy();
    expect(readFileSync(join(cwd, 'edit.txt'), 'utf-8')).toBe('hello OpenCC');
  });

  it('Edit fails on duplicate without replace_all', async () => {
    writeFileSync(join(cwd, 'dup.txt'), 'a a a');
    const res = await runTool(EditTool, { file_path: 'dup.txt', old_string: 'a', new_string: 'b' });
    expect(res.isError).toBe(true);
  });

  it('Bash runs command', async () => {
    const res = await runTool(BashTool, { command: 'echo hi' });
    expect(res.content).toContain('hi');
  });

  it('Bash captures nonzero exit', async () => {
    const res = await runTool(BashTool, { command: 'exit 42' });
    expect(res.isError).toBe(true);
    expect(res.content).toContain('42');
  });

  it('Bash times out', async () => {
    const res = await runTool(BashTool, { command: 'sleep 10', timeout: 100 });
    expect(res.isError).toBe(true);
    expect(res.content).toContain('timed out');
  });
});

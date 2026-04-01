import { describe, it, expect } from 'vitest';
import { simpleGlob } from '../src/utils/glob.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('simpleGlob', () => {
  const dir = join(tmpdir(), 'open-cc-test-' + Date.now());
  mkdirSync(join(dir, 'src', 'core'), { recursive: true });
  writeFileSync(join(dir, 'src', 'a.ts'), '');
  writeFileSync(join(dir, 'src', 'core', 'b.ts'), '');
  writeFileSync(join(dir, 'readme.md'), '');

  it('finds files with **/*.ts', () => {
    const results = simpleGlob('**/*.ts', dir);
    expect(results.sort()).toEqual(['src/a.ts', 'src/core/b.ts'].sort());
  });

  it('finds files with src/**/*.ts', () => {
    const results = simpleGlob('src/**/*.ts', dir);
    expect(results.sort()).toEqual(['src/a.ts', 'src/core/b.ts'].sort());
  });

  it('returns empty for no match', () => {
    const results = simpleGlob('**/*.py', dir);
    expect(results).toEqual([]);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });
});

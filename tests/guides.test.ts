import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import os from 'os';
import {
  loadGuides,
  listGuideNames,
  buildSystemPrompt,
  getGuideSearchPaths,
} from '../src/guides/loader.js';

describe('guides loader', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(os.tmpdir(), 'open-cc-guides-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads guides from a directory', () => {
    const container = join(tmpDir, 'guides');
    const guideDir = join(container, 'my-guide');
    mkdirSync(guideDir, { recursive: true });
    writeFileSync(join(guideDir, 'GUIDE.md'), 'Always use semicolons.');

    const guides = loadGuides([container]);
    expect(guides).toHaveLength(1);
    expect(guides[0].name).toBe('my-guide');
    expect(guides[0].content).toBe('Always use semicolons.');
  });

  it('filters guides by name', () => {
    const container = join(tmpDir, 'guides');
    const g1 = join(container, 'guide-a');
    const g2 = join(container, 'guide-b');
    mkdirSync(g1, { recursive: true });
    mkdirSync(g2, { recursive: true });
    writeFileSync(join(g1, 'GUIDE.md'), 'A');
    writeFileSync(join(g2, 'GUIDE.md'), 'B');

    const guides = loadGuides([container], ['guide-b']);
    expect(guides).toHaveLength(1);
    expect(guides[0].name).toBe('guide-b');
  });

  it('ignores directories without GUIDE.md', () => {
    const container = join(tmpDir, 'guides');
    const emptyDir = join(container, 'empty');
    mkdirSync(emptyDir, { recursive: true });

    const guides = loadGuides([container]);
    expect(guides).toHaveLength(0);
  });

  it('deduplicates by name (first seen wins)', () => {
    const homeContainer = join(tmpDir, 'home-guides');
    const projContainer = join(tmpDir, 'proj-guides');
    mkdirSync(homeContainer, { recursive: true });
    mkdirSync(projContainer, { recursive: true });

    const gHome = join(homeContainer, 'shared');
    const gProj = join(projContainer, 'shared');
    mkdirSync(gHome, { recursive: true });
    mkdirSync(gProj, { recursive: true });
    writeFileSync(join(gHome, 'GUIDE.md'), 'Home version');
    writeFileSync(join(gProj, 'GUIDE.md'), 'Project version');

    // home first, then project; dedup keeps the first seen
    const guides = loadGuides([homeContainer, projContainer]);
    const shared = guides.find((g) => g.name === 'shared');
    expect(shared).toBeDefined();
    expect(shared!.content).toBe('Home version');
  });

  it('lists guide names', () => {
    const container = join(tmpDir, 'guides');
    const g = join(container, 'foo');
    mkdirSync(g, { recursive: true });
    writeFileSync(join(g, 'GUIDE.md'), 'content');

    expect(listGuideNames([container])).toEqual(['foo']);
  });

  it('returns empty list when no guides exist', () => {
    expect(loadGuides([tmpDir])).toEqual([]);
    expect(listGuideNames([tmpDir])).toEqual([]);
  });
});

describe('buildSystemPrompt', () => {
  it('returns base prompt when no guides', () => {
    expect(buildSystemPrompt('Base', [])).toBe('Base');
  });

  it('appends guides to base prompt', () => {
    const guides = [
      { name: 'style', content: 'Use TypeScript.', sourcePath: '/x' },
      { name: 'tests', content: 'Use vitest.', sourcePath: '/y' },
    ];
    const result = buildSystemPrompt('Base', guides);
    expect(result).toContain('Base');
    expect(result).toContain('--- style ---');
    expect(result).toContain('Use TypeScript.');
    expect(result).toContain('--- tests ---');
    expect(result).toContain('Use vitest.');
  });
});

describe('getGuideSearchPaths', () => {
  it('includes home and project paths', () => {
    const paths = getGuideSearchPaths('/my/project');
    expect(paths[0]).toContain('.open-cc/guides');
    expect(paths[1]).toBe('/my/project/.open-cc/guides');
  });
});

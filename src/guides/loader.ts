import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import os from 'os';
import type { Guide } from './types.js';
export type { Guide } from './types.js';

const GUIDE_FILE_NAME = 'GUIDE.md';

function findGuideDirs(rootDir: string): string[] {
  if (!existsSync(rootDir)) return [];
  const dirs: string[] = [];
  try {
    const entries = readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        dirs.push(join(rootDir, entry.name));
      }
    }
  } catch {
    // ignore permission errors
  }
  return dirs;
}

function loadGuideFromDir(dir: string): Guide | null {
  const guidePath = join(dir, GUIDE_FILE_NAME);
  if (!existsSync(guidePath)) return null;
  try {
    const content = readFileSync(guidePath, 'utf-8');
    const name = dir.split(/[/\\]/).pop() || 'unknown';
    return { name, content: content.trim(), sourcePath: guidePath };
  } catch {
    return null;
  }
}

export function getGuideSearchPaths(cwd: string): string[] {
  const home = os.homedir();
  return [
    join(home, '.open-cc', 'guides'),
    resolve(cwd, '.open-cc', 'guides'),
  ];
}

export function loadGuides(cwd: string, names?: string[]): Guide[];
export function loadGuides(searchPaths: string[], names?: string[]): Guide[];
export function loadGuides(arg: string | string[], names?: string[]): Guide[] {
  const searchPaths = Array.isArray(arg) ? arg : getGuideSearchPaths(arg);
  const guideNames = names;
  const guides: Guide[] = [];
  const seen = new Set<string>();

  for (const searchPath of searchPaths) {
    const dirs = findGuideDirs(searchPath);
    for (const dir of dirs) {
      const guide = loadGuideFromDir(dir);
      if (!guide) continue;
      if (guideNames && guideNames.length > 0 && !guideNames.includes(guide.name)) continue;
      if (seen.has(guide.name)) continue;
      seen.add(guide.name);
      guides.push(guide);
    }
  }

  return guides;
}

export function listGuideNames(cwd: string): string[];
export function listGuideNames(searchPaths: string[]): string[];
export function listGuideNames(arg: string | string[]): string[] {
  return loadGuides(arg as any).map((g) => g.name);
}

export function buildSystemPrompt(basePrompt: string, guides: Guide[]): string {
  if (guides.length === 0) return basePrompt;
  const sections = guides.map((g) => `--- ${g.name} ---\n${g.content}`);
  return `${basePrompt}\n\nAdditional context:\n\n${sections.join('\n\n')}`;
}

import { readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';

function matchPart(part: string, name: string): boolean {
  if (part === '**') return true;
  const regex = new RegExp('^' + part.replace(/\./g, '\\.').replace(/\*/g, '[^/]*') + '$');
  return regex.test(name);
}

const DEFAULT_EXCLUDES = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv']);

function walk(dir: string, remainingParts: string[], results: string[], root: string, excludes: Set<string>) {
  if (remainingParts.length === 0) return;
  const part = remainingParts[0];
  const rest = remainingParts.slice(1);

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && part !== entry.name) continue; // skip hidden unless matched
      if (excludes.has(entry.name)) continue;
      const isDir = entry.isDirectory();
      const matched = matchPart(part, entry.name);

      if (part === '**') {
        // ** can match zero or more directories
        // Option 1: treat ** as matching this directory and continue with rest
        if (isDir) {
          walk(join(dir, entry.name), rest, results, root, excludes);
          walk(join(dir, entry.name), remainingParts, results, root, excludes);
        } else if (rest.length === 0 || matchPart(rest[0], entry.name)) {
          const filePath = join(dir, entry.name);
          results.push(relative(root, filePath) || filePath);
        }
      } else if (matched) {
        if (rest.length === 0) {
          results.push(relative(root, join(dir, entry.name)) || join(dir, entry.name));
        } else if (isDir) {
          walk(join(dir, entry.name), rest, results, root, excludes);
        }
      }
    }
  } catch {
    // ignore permission errors
  }
}

export function simpleGlob(pattern: string, cwd: string): string[] {
  const absPattern = resolve(cwd, pattern);
  const parts = absPattern.split(/[/\\]/).filter(Boolean);
  if (parts.length === 0) return [];

  // Determine base directory: walk up until we hit a non-wildcard part
  let baseIndex = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].includes('*') || parts[i] === '**') break;
    baseIndex = i + 1;
  }

  const baseDir = '/' + parts.slice(0, baseIndex).join('/');
  const patternParts = parts.slice(baseIndex);
  if (patternParts.length === 0) {
    // exact directory? return empty for simplicity
    return [];
  }

  const results: string[] = [];
  walk(baseDir, patternParts, results, cwd, DEFAULT_EXCLUDES);
  return [...new Set(results)].sort();
}

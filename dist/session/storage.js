import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const SESSION_DIR = join(homedir(), '.open-cc', 'sessions');
export function ensureSessionDir() {
    mkdirSync(SESSION_DIR, { recursive: true });
}
export function saveSession(id, messages) {
    ensureSessionDir();
    const path = join(SESSION_DIR, `${id}.json`);
    writeFileSync(path, JSON.stringify(messages, null, 2));
}
export function loadSession(id) {
    const path = join(SESSION_DIR, `${id}.json`);
    if (!existsSync(path))
        return null;
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    }
    catch {
        return null;
    }
}
export function listSessionsSync() {
    ensureSessionDir();
    try {
        return readdirSync(SESSION_DIR)
            .filter((f) => f.endsWith('.json'))
            .map((f) => f.replace('.json', ''));
    }
    catch {
        return [];
    }
}

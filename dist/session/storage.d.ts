export declare function ensureSessionDir(): void;
export declare function saveSession(id: string, messages: unknown[]): void;
export declare function loadSession(id: string): unknown[] | null;
export declare function listSessionsSync(): string[];

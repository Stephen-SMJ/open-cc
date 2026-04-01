#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { Command } from 'commander';
import { render } from 'ink';
import { App } from '../components/App.js';
import { Engine } from '../engine/query.js';
import { PermissionChecker } from '../permissions/checker.js';
import { saveSession, loadSession } from '../session/storage.js';
const SYSTEM_PROMPT = `You are Open-CC, a helpful terminal AI coding assistant.
You have access to tools: Read, Glob, Grep, Write, Edit, Bash.
Read-only tools are auto-approved. Write/Bash require user confirmation.
When editing files, prefer the Edit tool for small changes and Write for new files.
Always think step by step before taking action.`;
const DEFAULT_SESSION_ID = 'default';
function getModel() {
    return process.env.OPEN_CC_MODEL || 'gpt-4.1-mini';
}
async function runPrintMode(prompt, options) {
    const cwd = process.cwd();
    const checker = new PermissionChecker();
    if (options.autoApprove)
        checker.setMode('auto');
    let initialMessages = [];
    if (options.continue) {
        const loaded = loadSession(DEFAULT_SESSION_ID);
        if (loaded) {
            initialMessages = loaded;
        }
    }
    const engine = new Engine({
        model: options.model || getModel(),
        systemPrompt: SYSTEM_PROMPT,
        maxTokens: options.maxTokens ? Number(options.maxTokens) : undefined,
        cwd,
        permissionChecker: checker,
    });
    if (initialMessages.length) {
        engine.setMessages(initialMessages.map((m) => {
            if (m.role === 'user')
                return { role: 'user', content: m.content };
            if (m.role === 'assistant')
                return { role: 'assistant', content: m.content };
            return { role: 'tool', tool_call_id: `legacy_${Math.random()}`, content: m.result };
        }));
    }
    process.stdout.write(''); // ensure stdout is ready
    let hasOutput = false;
    const currentMessages = [...initialMessages];
    currentMessages.push({ role: 'user', content: prompt });
    let assistantText = '';
    for await (const event of engine.submit(prompt)) {
        if (event.type === 'text') {
            assistantText += event.text;
            process.stdout.write(event.text);
            hasOutput = true;
        }
        else if (event.type === 'tool_result') {
            currentMessages.push({ role: 'tool', toolName: event.toolName, result: event.result, isError: event.isError });
            if (options.verbose) {
                console.error(`\n[${event.toolName}] ${event.isError ? 'ERROR' : 'OK'}`);
            }
        }
    }
    if (assistantText) {
        currentMessages.push({ role: 'assistant', content: assistantText });
    }
    if (hasOutput)
        process.stdout.write('\n');
    saveSession(DEFAULT_SESSION_ID, currentMessages);
}
async function main() {
    const program = new Command();
    program
        .name('open-cc')
        .description('An open-source terminal AI coding assistant')
        .version('0.1.0')
        .option('--model <model>', 'Model to use', getModel())
        .option('--max-tokens <n>', 'Max tokens per response')
        .option('--auto-approve', 'Auto-approve all tool permissions', false)
        .option('-p, --print', 'Print mode (non-interactive)', false)
        .option('--verbose', 'Verbose output in print mode', false)
        .option('--continue', 'Continue the previous session', false)
        .argument('[prompt...]', 'Optional prompt')
        .action(async (promptParts, options) => {
        const prompt = promptParts.join(' ').trim();
        const hasStdin = !process.stdin.isTTY;
        let finalPrompt = prompt;
        if (!finalPrompt && hasStdin) {
            const chunks = [];
            for await (const chunk of process.stdin) {
                chunks.push(chunk);
            }
            finalPrompt = Buffer.concat(chunks).toString('utf-8').trim();
        }
        const isInteractive = process.stdin.isTTY && process.stdout.isTTY && !options.print;
        if (!isInteractive || options.print) {
            if (!finalPrompt) {
                console.error('Error: prompt required in non-interactive mode.');
                process.exit(1);
            }
            await runPrintMode(finalPrompt, options);
            return;
        }
        let initialMessages = [];
        if (options.continue) {
            const loaded = loadSession(DEFAULT_SESSION_ID);
            if (loaded) {
                initialMessages = loaded;
                console.log(`Loaded previous session with ${initialMessages.length} messages.`);
            }
        }
        let currentMessages = [...initialMessages];
        const saveOnExit = () => {
            if (currentMessages.length > 0) {
                saveSession(DEFAULT_SESSION_ID, currentMessages);
            }
        };
        process.on('exit', saveOnExit);
        process.on('SIGINT', () => {
            saveOnExit();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            saveOnExit();
            process.exit(0);
        });
        // Interactive TUI mode
        render(_jsx(App, { model: options.model, maxTokens: options.maxTokens ? Number(options.maxTokens) : undefined, cwd: process.cwd(), autoApprove: options.autoApprove, initialInput: finalPrompt || undefined, initialMessages: initialMessages, onMessagesChange: (msgs) => {
                currentMessages = msgs;
            } }));
    });
    await program.parseAsync(process.argv);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});

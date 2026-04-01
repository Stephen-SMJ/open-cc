import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { Engine } from '../engine/query.js';
import { PermissionChecker } from '../permissions/checker.js';
import { Messages } from './Messages.js';
import { PermissionDialog } from './PermissionDialog.js';
import { Logo } from './Logo.js';
const SYSTEM_PROMPT = `You are Open-CC, a helpful terminal AI coding assistant.
You have access to tools: Read, Glob, Grep, Write, Edit, Bash.
Read-only tools are auto-approved. Write/Bash require user confirmation.
When editing files, prefer the Edit tool for small changes and Write for new files.
Always think step by step before taking action.`;
export function App({ model, maxTokens, cwd, autoApprove, initialInput, printMode, initialMessages = [], onMessagesChange, }) {
    const { exit } = useApp();
    const [messages, setMessages] = useState(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [permissionRequest, setPermissionRequest] = useState(null);
    const engineRef = useRef(null);
    const permissionCheckerRef = useRef(new PermissionChecker());
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
        onMessagesChange?.(messages);
    }, [messages, onMessagesChange]);
    useEffect(() => {
        permissionCheckerRef.current.setMode(autoApprove ? 'auto' : 'default');
    }, [autoApprove]);
    useEffect(() => {
        engineRef.current = new Engine({
            model,
            systemPrompt: SYSTEM_PROMPT,
            maxTokens,
            cwd,
            permissionChecker: permissionCheckerRef.current,
            onPermissionRequest: async (tool, input) => {
                if (printMode)
                    return false;
                return new Promise((resolve) => {
                    setPermissionRequest({ tool, input, resolve });
                });
            },
        });
        if (initialMessages.length) {
            engineRef.current.setMessages(initialMessages.map((m) => {
                if (m.role === 'user')
                    return { role: 'user', content: m.content };
                if (m.role === 'assistant')
                    return { role: 'assistant', content: m.content };
                return { role: 'tool', tool_call_id: `legacy_${Math.random()}`, content: m.result };
            }));
        }
    }, [model, maxTokens, cwd, printMode, initialMessages]);
    useInput((inputChar, key) => {
        if (key.ctrl && inputChar === 'd') {
            engineRef.current?.abort();
            exit();
        }
        if (key.ctrl && inputChar === 'c') {
            if (isThinking) {
                engineRef.current?.abort();
            }
            else {
                setInputValue('');
            }
        }
    });
    const handleAnswer = useCallback((answer) => {
        if (!permissionRequest)
            return;
        if (answer === 'always') {
            permissionCheckerRef.current.approveForSession(permissionRequest.tool.name);
        }
        permissionRequest.resolve(answer === 'yes' || answer === 'always');
        setPermissionRequest(null);
    }, [permissionRequest]);
    const sendMessage = useCallback(async (text) => {
        if (!engineRef.current || !text.trim())
            return;
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setInputValue('');
        setIsThinking(true);
        let assistantBuffer = '';
        let currentAssistantAdded = false;
        for await (const event of engineRef.current.submit(text.trim())) {
            if (event.type === 'text') {
                assistantBuffer += event.text;
                setMessages((prev) => {
                    if (!currentAssistantAdded) {
                        currentAssistantAdded = true;
                        return [...prev, { role: 'assistant', content: assistantBuffer }];
                    }
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.role === 'assistant') {
                        last.content = assistantBuffer;
                    }
                    return next;
                });
            }
            else if (event.type === 'tool_result') {
                setMessages((prev) => [
                    ...prev,
                    { role: 'tool', toolName: event.toolName, result: event.result, isError: event.isError },
                ]);
                currentAssistantAdded = false;
                assistantBuffer = '';
            }
            else if (event.type === 'waiting') {
                setIsThinking(false);
            }
        }
        setIsThinking(false);
    }, []);
    // Handle initial input for print mode or direct prompt
    useEffect(() => {
        if (initialInput && engineRef.current) {
            sendMessage(initialInput).then(() => {
                if (printMode) {
                    const last = engineRef.current.getMessages().slice(-1)[0];
                    if (last && last.role === 'assistant' && typeof last.content === 'string') {
                        console.log(last.content);
                    }
                    exit();
                }
            });
        }
    }, [initialInput, printMode, exit, sendMessage]);
    return (_jsxs(Box, { flexDirection: "column", height: "100%", children: [messages.length === 0 && !printMode && _jsx(Logo, {}), _jsx(Box, { flexDirection: "column", flexGrow: 1, children: _jsx(Messages, { messages: messages }) }), permissionRequest && (_jsx(PermissionDialog, { tool: permissionRequest.tool, input: permissionRequest.input, onAnswer: handleAnswer })), isThinking && !permissionRequest && (_jsxs(Box, { marginY: 1, children: [_jsx(Text, { color: "green", children: _jsx(Spinner, { type: "dots" }) }), _jsx(Text, { children: " Thinking\u2026" })] })), !isThinking && !permissionRequest && !printMode && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, children: _jsxs(Box, { children: [_jsx(Text, { bold: true, color: "cyan", children: '➜ ' }), _jsx(TextInput, { value: inputValue, onChange: setInputValue, onSubmit: sendMessage })] }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Enter: send \u2022 Shift+Enter: newline \u2022 Ctrl+C: stop/clear \u2022 Ctrl+D: quit" }) })] }))] }));
}

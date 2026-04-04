import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import TextInput from 'ink-text-input';
import { Engine } from '../engine/query.js';
import { PermissionChecker } from '../permissions/checker.js';
import type { AnyTool } from '../tools/base.js';
import { Messages, type MessageItem } from './Messages.js';
import { PermissionDialog } from './PermissionDialog.js';
import { Logo } from './Logo.js';
import type { Guide } from '../guides/types.js';
import { TodoStore } from '../todos/store.js';

const SYSTEM_PROMPT = `You are Open-CC, a helpful terminal AI coding assistant.
You have access to tools: Read, Glob, Grep, Write, Edit, Bash, TodoListCreate, TodoListUpdate.
Read-only tools are auto-approved. Write/Bash require user confirmation, but YOU MUST NOT ask for permission in plain text. Invoke the tool directly; the system will pause and ask the user automatically.
When editing files, prefer the Edit tool for small changes and Write for new files.
For multi-step tasks, create a todo list using TodoListCreate first, then update progress with TodoListUpdate as you complete each step.
Always think step by step before taking action.`;

export type AppProps = {
  model: string;
  maxTokens?: number;
  cwd: string;
  autoApprove?: boolean;
  initialInput?: string;
  printMode?: boolean;
  initialMessages?: MessageItem[];
  onMessagesChange?: (messages: MessageItem[]) => void;
  guides?: Guide[];
};

export function App({
  model,
  maxTokens,
  cwd,
  autoApprove,
  initialInput,
  printMode,
  initialMessages = [],
  onMessagesChange,
  guides = [],
}: AppProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [permissionRequest, setPermissionRequest] = useState<{
    tool: AnyTool;
    input: unknown;
    resolve: (answer: boolean) => void;
  } | null>(null);
  const [todos, setTodos] = useState<TodoStore['getItems'] extends () => infer R ? R : never>([]);

  const engineRef = useRef<Engine | null>(null);
  const permissionCheckerRef = useRef<PermissionChecker>(new PermissionChecker());
  const messagesRef = useRef<MessageItem[]>(messages);
  const todoStoreRef = useRef<TodoStore>(new TodoStore());

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
      guides,
      todoStore: todoStoreRef.current,
      onPermissionRequest: async (tool, input) => {
        if (printMode) return false;
        return new Promise((resolve) => {
          setPermissionRequest({ tool, input, resolve });
        });
      },
    });
    if (initialMessages.length) {
      engineRef.current.setMessages(
        initialMessages.map((m) => {
          if (m.role === 'user') return { role: 'user', content: m.content };
          if (m.role === 'assistant') return { role: 'assistant', content: m.content };
          return { role: 'tool', tool_call_id: (m as any).tool_call_id || `legacy_${Math.random()}`, content: m.result };
        }),
      );
    }
  }, [model, maxTokens, cwd, printMode, initialMessages, guides]);

  useInput((inputChar, key) => {
    if (key.ctrl && inputChar === 'd') {
      engineRef.current?.abort();
      exit();
    }
    if (key.ctrl && inputChar === 'c') {
      if (isWorking) {
        engineRef.current?.abort();
      } else {
        setInputValue('');
      }
    }
  });

  const handleAnswer = useCallback((answer: 'yes' | 'no' | 'always') => {
    if (!permissionRequest) return;
    if (answer === 'always') {
      permissionCheckerRef.current.approveForSession(permissionRequest.tool.name);
    }
    permissionRequest.resolve(answer === 'yes' || answer === 'always');
    setPermissionRequest(null);
  }, [permissionRequest]);

  const sendMessage = useCallback(async (text: string) => {
    if (!engineRef.current || !text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setIsWorking(true);

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
      } else if (event.type === 'tool_result') {
        setMessages((prev) => {
          if (!currentAssistantAdded) {
            // Model called tools without emitting text first; inject empty assistant message
            return [
              ...prev,
              { role: 'assistant', content: '' },
              { role: 'tool', toolName: event.toolName, result: event.result, isError: event.isError, tool_call_id: event.toolCallId },
            ];
          }
          return [
            ...prev,
            { role: 'tool', toolName: event.toolName, result: event.result, isError: event.isError, tool_call_id: event.toolCallId },
          ];
        });
        currentAssistantAdded = false;
        assistantBuffer = '';
      } else if (event.type === 'todos_changed') {
        setTodos([...todoStoreRef.current.getItems()]);
      }
    }

    setIsWorking(false);
  }, []);

  // Handle initial input for print mode or direct prompt
  useEffect(() => {
    if (initialInput && engineRef.current) {
      sendMessage(initialInput).then(() => {
        if (printMode) {
          const last = engineRef.current!.getMessages().slice(-1)[0];
          if (last && last.role === 'assistant' && typeof last.content === 'string') {
            console.log(last.content);
          }
          exit();
        }
      });
    }
  }, [initialInput, printMode, exit, sendMessage]);

  return (
    <Box flexDirection="column" height="100%">
      {!printMode && <Logo />}

      <Box flexDirection="column" flexGrow={1}>
        <Messages messages={messages} todos={todos} />
      </Box>

      {permissionRequest && (
        <PermissionDialog tool={permissionRequest.tool} input={permissionRequest.input} onAnswer={handleAnswer} />
      )}

      {isWorking && !permissionRequest && (
        <Box marginY={1}>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> open-cc is working…</Text>
        </Box>
      )}

      {!isWorking && !permissionRequest && !printMode && (
        <Box flexDirection="column">
          <Box borderStyle="round" borderColor="cyan" paddingX={1}>
            <Box>
              <Text bold color="cyan">{'➜ '}</Text>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={sendMessage}
              />
            </Box>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>
              Enter: send • Shift+Enter: newline • Ctrl+C: stop/clear • Ctrl+D: quit
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

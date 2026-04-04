import React from 'react';
import { Box, Text, useStdout, Static } from 'ink';
import type { TodoItem } from '../todos/types.js';

export type MessageItem =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool'; toolName: string; result: string; isError: boolean; tool_call_id?: string };

function statusIcon(status: TodoItem['status']) {
  switch (status) {
    case 'done': return <Text color="green">✓</Text>;
    case 'failed': return <Text color="red">✗</Text>;
    case 'in_progress': return <Text color="yellow">◐</Text>;
    default: return <Text dimColor>○</Text>;
  }
}

export function TodoPanel({ todos }: { todos: TodoItem[] }) {
  return (
    <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="gray" paddingX={1}>
      <Text bold dimColor>Todo List</Text>
      {todos.map((todo) => (
        <Box key={todo.id}>
          {statusIcon(todo.status)}
          <Text dimColor={todo.status === 'done' || todo.status === 'failed'}> {todo.title}</Text>
        </Box>
      ))}
    </Box>
  );
}

function MessageBlock({ message, showSeparator }: { message: MessageItem; showSeparator: boolean }) {
  const { stdout } = useStdout();
  const separator = '─'.repeat(Math.max(10, stdout.columns - 2));

  const separatorEl = showSeparator ? (
    <Box marginY={1}>
      <Text color="blue">{separator}</Text>
    </Box>
  ) : null;

  if (message.role === 'user') {
    return (
      <Box flexDirection="column">
        {separatorEl}
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="cyan">You</Text>
          <Text>{message.content}</Text>
        </Box>
      </Box>
    );
  }
  if (message.role === 'assistant') {
    return (
      <Box flexDirection="column">
        {separatorEl}
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color="green">open-cc</Text>
          <Text>{message.content}</Text>
        </Box>
      </Box>
    );
  }
  return (
    <Box flexDirection="column">
      {separatorEl}
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>↳ {message.toolName} {message.isError ? <Text color="red">✗</Text> : <Text color="green">✓</Text>}</Text>
        <Text dimColor>{message.result.slice(0, 300)}{message.result.length > 300 ? '...' : ''}</Text>
      </Box>
    </Box>
  );
}

type Props = {
  messages: MessageItem[];
  todos?: TodoItem[];
};

export function Messages({ messages, todos = [] }: Props) {
  const { stdout } = useStdout();
  const separator = '─'.repeat(Math.max(10, stdout.columns - 2));

  // If the last message is an assistant, it may still be streaming.
  // Render it outside Static so it can update live.
  let staticMessages = messages;
  let streamingMessage: MessageItem | null = null;
  if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
    staticMessages = messages.slice(0, -1);
    streamingMessage = messages[messages.length - 1] as Extract<MessageItem, { role: 'assistant' }>;
  }

  const hasHistory = staticMessages.length > 0;

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Static items={staticMessages}>
        {(message, index) => <MessageBlock key={index} message={message} showSeparator={index > 0} />}
      </Static>
      {streamingMessage && (
        <Box flexDirection="column" marginTop={hasHistory ? 1 : 0}>
          {hasHistory && (
            <Box marginY={1}>
              <Text color="blue">{separator}</Text>
            </Box>
          )}
          <MessageBlock message={streamingMessage} showSeparator={false} />
        </Box>
      )}
      {todos.length > 0 && (
        <Box marginTop={hasHistory || streamingMessage ? 1 : 0}>
          <TodoPanel todos={todos} />
        </Box>
      )}
    </Box>
  );
}

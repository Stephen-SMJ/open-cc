import React from 'react';
import { Box, Text } from 'ink';

export type MessageItem =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string }
  | { role: 'tool'; toolName: string; result: string; isError: boolean };

type Props = {
  messages: MessageItem[];
};

export function Messages({ messages }: Props) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {messages.map((m, i) => {
        if (m.role === 'user') {
          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text bold color="cyan">You</Text>
              <Text>{m.content}</Text>
            </Box>
          );
        }
        if (m.role === 'assistant') {
          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text bold color="green">open-cc</Text>
              <Text>{m.content}</Text>
            </Box>
          );
        }
        return (
          <Box key={i} flexDirection="column" marginBottom={1}>
            <Text dimColor>↳ {m.toolName} {m.isError ? <Text color="red">✗</Text> : <Text color="green">✓</Text>}</Text>
            <Text dimColor>{m.result.slice(0, 300)}{m.result.length > 300 ? '...' : ''}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { AnyTool } from '../tools/base.js';

type Props = {
  tool: AnyTool;
  input: unknown;
  onAnswer: (answer: 'yes' | 'no' | 'always') => void;
};

export function PermissionDialog({ tool, input, onAnswer }: Props) {
  useInput((inputChar) => {
    const c = inputChar.toLowerCase();
    if (c === 'y') onAnswer('yes');
    if (c === 'n') onAnswer('no');
    if (c === 'a') onAnswer('always');
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginY={1}>
      <Text bold color="yellow">Permission required: {tool.name}</Text>
      <Text dimColor>{JSON.stringify(input, null, 2)}</Text>
      <Box marginTop={1}>
        <Text>Allow? [y]es / [n]o / [a]lways: </Text>
      </Box>
    </Box>
  );
}

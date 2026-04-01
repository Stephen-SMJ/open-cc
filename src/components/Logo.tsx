import React from 'react';
import { Box, Text } from 'ink';

export function Logo() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan">
{` ██████  ██████  ███████ ██   ██  ██████  ██████ `}
      </Text>
      <Text color="cyan">
{`██    ██ ██   ██ ██      ███  ██ ██      ██     `}
      </Text>
      <Text color="cyan">
{`██    ██ ██████  █████   ████ ██ ██      ██     `}
      </Text>
      <Text color="cyan">
{`██    ██ ██      ██      ██ ████ ██      ██     `}
      </Text>
      <Text color="cyan">
{` ██████  ██      ███████ ██   ██  ██████  ██████`}
      </Text>
      <Text dimColor>  Open-source terminal AI coding assistant</Text>
    </Box>
  );
}

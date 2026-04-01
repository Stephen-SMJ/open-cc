import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
};

export function PromptInput({ value, onChange, onSubmit, disabled }: Props) {
  return (
    <Box>
      <Text bold color="cyan">{'> '}</Text>
      <TextInput
        value={value}
        onChange={disabled ? () => {} : onChange}
        onSubmit={disabled ? () => {} : onSubmit}
      />
    </Box>
  );
}

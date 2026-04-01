import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
export function PromptInput({ value, onChange, onSubmit, disabled }) {
    return (_jsxs(Box, { children: [_jsx(Text, { bold: true, color: "cyan", children: '> ' }), _jsx(TextInput, { value: value, onChange: disabled ? () => { } : onChange, onSubmit: disabled ? () => { } : onSubmit })] }));
}

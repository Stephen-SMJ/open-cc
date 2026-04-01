import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
export function PermissionDialog({ tool, input, onAnswer }) {
    useInput((inputChar) => {
        const c = inputChar.toLowerCase();
        if (c === 'y')
            onAnswer('yes');
        if (c === 'n')
            onAnswer('no');
        if (c === 'a')
            onAnswer('always');
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 1, marginY: 1, children: [_jsxs(Text, { bold: true, color: "yellow", children: ["Permission required: ", tool.name] }), _jsx(Text, { dimColor: true, children: JSON.stringify(input, null, 2) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: "Allow? [y]es / [n]o / [a]lways: " }) })] }));
}

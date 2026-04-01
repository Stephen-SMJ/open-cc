import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function Messages({ messages }) {
    return (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: messages.map((m, i) => {
            if (m.role === 'user') {
                return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "You" }), _jsx(Text, { children: m.content })] }, i));
            }
            if (m.role === 'assistant') {
                return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: "green", children: "Assistant" }), _jsx(Text, { children: m.content })] }, i));
            }
            return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Text, { dimColor: true, children: ["\u21B3 ", m.toolName, " ", m.isError ? _jsx(Text, { color: "red", children: "\u2717" }) : _jsx(Text, { color: "green", children: "\u2713" })] }), _jsxs(Text, { dimColor: true, children: [m.result.slice(0, 300), m.result.length > 300 ? '...' : ''] })] }, i));
        }) }));
}

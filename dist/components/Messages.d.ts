export type MessageItem = {
    role: 'user';
    content: string;
} | {
    role: 'assistant';
    content: string;
} | {
    role: 'tool';
    toolName: string;
    result: string;
    isError: boolean;
};
type Props = {
    messages: MessageItem[];
};
export declare function Messages({ messages }: Props): import("react/jsx-runtime").JSX.Element;
export {};

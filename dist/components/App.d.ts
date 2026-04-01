import { type MessageItem } from './Messages.js';
export type AppProps = {
    model: string;
    maxTokens?: number;
    cwd: string;
    autoApprove?: boolean;
    initialInput?: string;
    printMode?: boolean;
    initialMessages?: MessageItem[];
    onMessagesChange?: (messages: MessageItem[]) => void;
};
export declare function App({ model, maxTokens, cwd, autoApprove, initialInput, printMode, initialMessages, onMessagesChange, }: AppProps): import("react/jsx-runtime").JSX.Element;

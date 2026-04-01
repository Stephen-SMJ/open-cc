import type { AnyTool } from '../tools/base.js';
type Props = {
    tool: AnyTool;
    input: unknown;
    onAnswer: (answer: 'yes' | 'no' | 'always') => void;
};
export declare function PermissionDialog({ tool, input, onAnswer }: Props): import("react/jsx-runtime").JSX.Element;
export {};

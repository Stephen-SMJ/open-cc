import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../src/components/App.js';

describe('App UI', () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('shows logo when no messages', () => {
    const { lastFrame } = render(
      <App model="test" cwd="/tmp" />
    );
    const frame = lastFrame() || '';
    expect(frame).toContain('Open-source');
    expect(frame).toContain('➜');
    expect(frame).toContain('Enter: send');
    expect(frame).toContain('Ctrl+D: quit');
    expect(frame).toContain('Shift+Enter: newline');
    expect(frame).toContain('Ctrl+C: stop/clear');
  });

  it('shows user message after submit in print-like flow', () => {
    const { lastFrame } = render(
      <App model="test" cwd="/tmp" initialMessages={[{ role: 'user', content: 'hello' }]} />
    );
    const frame = lastFrame() || '';
    expect(frame).toContain('You');
    expect(frame).toContain('hello');
  });
});

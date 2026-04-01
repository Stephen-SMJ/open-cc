<div align="center">

# open-cc

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Ink](https://img.shields.io/badge/Ink-Terminal%20UI-000?logo=terminal)](https://github.com/vadimdemedes/ink)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**An open-source terminal AI coding assistant.**  
*Inspired by Claude Code, built for everyone.*

[English](./README.md) | [中文](./README_CN.md)

</div>

---

## ✨ Features

- **Interactive TUI** — Built with [Ink](https://github.com/vadimdemedes/ink) and React, providing a smooth terminal chat experience
- **Agentic Tool Loop** — The model autonomously decides when to read, search, edit, write, or run shell commands
- **6 Built-in Tools** — `Read`, `Glob`, `Grep`, `Write`, `Edit`, `Bash`
- **Permission System** — Read-only tools are auto-approved; write/bash commands require your confirmation
- **Session Persistence** — Conversations are auto-saved. Use `--continue` to resume where you left off
- **OpenAI-Compatible API** — Works with OpenAI, Azure, OpenRouter, and any OpenAI-compatible endpoint
- **Non-Interactive Mode** — Use `-p` for one-shot prompts or piping in scripts

---

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) >= 18
- An OpenAI-compatible API key

### Install globally via npm

```bash
# Clone the repository
git clone https://github.com/Stephen-SMJ/open-cc.git
cd open-cc

# Install dependencies
npm install

# Build & link globally
npm run build
npm link
```

Now `open-cc` is available globally in your terminal.

---

## 🔧 Configuration

### Environment Variables

Set these in your shell `~/.bashrc`, `~/.zshrc`, or before running `open-cc`:

```bash
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPEN_CC_MODEL="gpt-4o"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ | — | Your API key |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | API base URL (useful for proxies) |
| `OPEN_CC_MODEL` | ❌ | `gpt-4.1-mini` | Default model to use |

### One-shot / Scripted Mode

You can also pass credentials directly via CLI flags:

```bash
open-cc \
  --model gpt-4o \
  -p "summarize this codebase in 3 bullets"
```

---

## 🚀 Usage

### Interactive REPL

```bash
open-cc
```

Type your request and press `Enter`. The assistant will stream its response and may ask for permission before running write or bash tools.

### Resume Previous Session

```bash
open-cc --continue
```

### One-shot Prompt (Print Mode)

```bash
# Direct prompt
open-cc -p "list all TypeScript files in src"

# Pipe input
echo "what does engine.ts do?" | open-cc -p
```

### Auto-approve All Permissions

```bash
open-cc --auto-approve
```

> ⚠️ Use with caution. This skips confirmation dialogs for all tools.

---

## ⌨️ Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift + Enter` | Insert newline in input |
| `Ctrl + C` | Stop current turn **or** clear input box |
| `Ctrl + D` | Quit `open-cc` |

---

## 🛠️ Tools

| Tool | Permission | Description |
|------|------------|-------------|
| `Read` | Auto | Read file contents with optional offset & limit |
| `Glob` | Auto | Find files matching a glob pattern |
| `Grep` | Auto | Search file contents with regex |
| `Write` | Ask | Write content to a file |
| `Edit` | Ask | Replace a unique string in a file |
| `Bash` | Ask | Run a shell command |

---

## 🧪 Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Dev without building
npm run dev
```

---

## 📄 License

MIT © [Stephen-SMJ](https://github.com/Stephen-SMJ)

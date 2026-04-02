<div align="center">
<img width="230" height="51" alt="image" src="https://github.com/user-attachments/assets/7a29dc81-69e0-4492-9a44-f9bb051b5e29" />



[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Ink](https://img.shields.io/badge/Ink-Terminal%20UI-000?logo=terminal)](https://github.com/vadimdemedes/ink)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**An open-source terminal AI coding assistant.**  
*Inspired by Claude Code, built for everyone.*

[English](./README.md) | [中文](./README_CN.md)

<img width="952" height="322" alt="CleanShot 2026-04-02 at 15 03 58@2x" src="https://github.com/user-attachments/assets/2de7475b-c958-41cb-8fd7-375e733d4d95" />


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

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/Stephen-SMJ/open-cc/main/install.sh | bash
```

Clones to `~/.open-cc`, installs dependencies, builds the project, and places a launcher in `~/.local/bin`. No `sudo` required.

**Options** (set as env vars before the command):

| Variable | Default | Description |
|---|---|---|
| `OPEN_CC_INSTALL_DIR` | `~/.open-cc` | Where to clone the repo |
| `OPEN_CC_BIN_DIR` | `~/.local/bin` | Where to put the `open-cc` launcher |
| `OPEN_CC_BRANCH` | `main` | Git branch to install |

### Manual install from source

```bash
git clone https://github.com/Stephen-SMJ/open-cc.git
cd open-cc
npm install
npm run build
npm link
```

Now `open-cc` is available globally in your terminal.

### Uninstall

If you installed via the one-line script, remove it with:

```bash
rm -rf ~/.open-cc
rm -f ~/.local/bin/open-cc
```

If you used `npm link`, unlink first:

```bash
cd open-cc
npm unlink -g
rm -rf open-cc
```

---

## 🔧 Configuration

### Environment Variables

Set these in your shell `~/.bashrc`, `~/.zshrc`, or before running `open-cc`:

```bash
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPEN_CC_MODEL="gpt-5.3-codex"
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

<div align="center">

<img width="230" height="51" alt="image" src="https://github.com/user-attachments/assets/7a29dc81-69e0-4492-9a44-f9bb051b5e29" />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Ink](https://img.shields.io/badge/Ink-终端UI-000?logo=terminal)](https://github.com/vadimdemedes/ink)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**一款开源的终端 AI 编程助手。**  
*灵感来自 Claude Code，为所有人打造。*

[English](./README.md) | [中文](./README_CN.md)

<img width="952" height="322" alt="CleanShot 2026-04-02 at 15 03 58@2x" src="https://github.com/user-attachments/assets/2de7475b-c958-41cb-8fd7-375e733d4d95" />

</div>

---

## ✨ 特性

- **交互式 TUI** — 基于 [Ink](https://github.com/vadimdemedes/ink) 和 React 构建，提供丝滑的终端对话体验
- **Agent 工具循环** — 模型自主决定何时读取、搜索、编辑、写入或执行命令
- **6 个内置工具** — `Read`（读）、`Glob`（查找）、`Grep`（搜索）、`Write`（写）、`Edit`（改）、`Bash`（命令）
- **权限系统** — 只读工具自动放行，写操作 / Bash 命令需要用户确认
- **会话持久化** — 自动保存对话记录，使用 `--continue` 即可恢复上下文继续聊
- **多步任务追踪（Todo List）** — 复杂任务自动拆解为子任务列表，可视化跟踪进度
- **兼容 OpenAI 接口** — 支持 OpenAI、Azure、OpenRouter 及所有 OpenAI 兼容端点
- **非交互模式** — 使用 `-p` 参数进行一次性问答，方便脚本和管道调用

---

## 📦 安装

### 前置要求
- [Node.js](https://nodejs.org/) >= 18
- 一个 OpenAI 兼容的 API Key

### 一行命令安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/Stephen-SMJ/open-cc/main/install.sh | bash
```

自动克隆到 `~/.open-cc`，安装依赖，构建项目，并在 `~/.local/bin` 创建启动器。无需 `sudo`。

**自定义选项**（在命令前设置环境变量）：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `OPEN_CC_INSTALL_DIR` | `~/.open-cc` | 仓库克隆位置 |
| `OPEN_CC_BIN_DIR` | `~/.local/bin` | `open-cc` 启动器位置 |
| `OPEN_CC_BRANCH` | `main` | 要安装的 Git 分支 |

### 手动从源码安装

```bash
git clone https://github.com/Stephen-SMJ/open-cc.git
cd open-cc
npm install
npm run build
npm link
```

安装完成后，在终端的任何位置都可以直接输入 `open-cc` 启动。

### 卸载

如果通过一行命令脚本安装，执行以下命令卸载：

```bash
rm -rf ~/.open-cc
rm -f ~/.local/bin/open-cc
```

如果使用了 `npm link`，先 unlink 再删除：

```bash
cd open-cc
npm unlink -g
rm -rf open-cc
```

---

## 🔧 配置

### 环境变量

建议在 `~/.bashrc`、`~/.zshrc` 中配置，或者在运行前直接 export：

```bash
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPEN_CC_MODEL="gpt-5.3-codex"
```

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `OPENAI_API_KEY` | ✅* | — | API 密钥 |
| `ANTHROPIC_API_KEY` | ✅* | — | 当 `OPENAI_API_KEY` 未设置时的回退选项 |
| `OPENAI_BASE_URL` | ❌ | `https://api.openai.com/v1` | API 基础地址（代理/第三方平台可用） |
| `OPEN_CC_MODEL` | ❌ | `gpt-4.1-mini` | 默认使用的模型 |

> *`OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY` 至少设置一个即可。
>
> ⚠️ **关于 `ANTHROPIC_API_KEY` 的声明**：Anthropic 的 API Key 仅授权用于 Anthropic 官方服务。将其用于第三方或代理端点可能违反其服务条款，并可能导致账号被封禁。请自行承担使用风险。

### 命令行参数

你也可以通过 CLI 参数临时指定配置：

```bash
open-cc \
  --model gpt-5.3-codex \
  -p "用 3 个要点总结这个代码库"
```

---

## 🚀 使用方式

### 交互式对话

```bash
open-cc
```

输入你的问题并按 `Enter`，助手会流式返回回答。如果需要执行写入或 Bash 操作，会先弹出确认框。

### 恢复上次会话

```bash
open-cc --continue
```

### 一次性问答（打印模式）

```bash
# 直接提问
open-cc -p "列出 src 下所有的 TypeScript 文件"

# 管道输入
echo "engine.ts 是做什么的？" | open-cc -p
```

### 自动批准所有权限

```bash
open-cc --auto-approve
```

> ⚠️ 谨慎使用。此模式会跳过所有工具确认弹窗。

### Guides（自定义上下文 / Skills）

`open-cc` 支持加载自定义 **guides** —— 即会被注入到 system prompt 中的 Markdown 上下文文件。这非常适合用来统一代码风格、项目规范或特定的工作流程。

#### 创建 guide

在 `~/.open-cc/guides/`（全局）或 `./.open-cc/guides/`（项目本地）下新建目录，并在目录中放置 `GUIDE.md`：

```bash
mkdir -p ~/.open-cc/guides/rust

cat <<'EOF' > ~/.open-cc/guides/rust/GUIDE.md
写 Rust 代码时请遵守以下规范：
- 优先使用 `Result<T, E>`，避免 panic。
- 每次构建后运行 `cargo clippy`。
- 尽量用 `match` 而不是 `unwrap()`。
EOF
```

#### 使用 guides

自动加载**所有**可用的 guides：

```bash
open-cc
```

只加载**指定**的 guides：

```bash
open-cc --guide rust
open-cc --guide rust --guide tests
```

同名的项目本地 guide 会覆盖全局 guide。

### Todo List（多步任务追踪）

遇到复杂请求时，`open-cc` 可以创建 todo 列表并在执行过程中更新进度，你会在对话上方看到一个实时任务面板。

```bash
open-cc
# 然后提问："把 src/engine/query.ts 拆成更小的模块"
```

模型会自动调用 `TodoListCreate` 规划步骤，随后通过 `TodoListUpdate` 逐项标记完成。

> **提示**：`TodoListCreate` 和 `TodoListUpdate` 属于纯内存操作，已设置为自动放行，无需手动确认。

### 工作状态指示

当 `open-cc` 正在思考、执行工具或等待权限时，你会在消息下方看到 `⠋ open-cc is working…`。按 `Ctrl+C` 可随时取消当前回合。

---

## ⌨️ 快捷键

| 按键 | 作用 |
|------|------|
| `Enter` | 发送消息 |
| `Shift + Enter` | 在输入框中换行 |
| `Ctrl + C` | 停止当前生成 **或** 清空输入框 |
| `Ctrl + D` | 退出 `open-cc` |

---

## 🛠️ 工具列表

| 工具 | 权限 | 说明 |
|------|------|------|
| `Read` | 自动 | 读取文件内容，支持指定行号范围 |
| `Glob` | 自动 | 按 glob 模式查找文件 |
| `Grep` | 自动 | 使用正则搜索文件内容 |
| `Write` | 询问 | 将内容写入文件 |
| `Edit` | 询问 | 替换文件中唯一的字符串 |
| `Bash` | 询问 | 执行 Shell 命令 |

---

## 🧪 开发

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch

# 开发运行（无需手动构建）
npm run dev
```

---

## 📄 许可证

MIT © [Stephen-SMJ](https://github.com/Stephen-SMJ)

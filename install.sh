#!/usr/bin/env bash
set -e

INSTALL_DIR="${OPEN_CC_INSTALL_DIR:-$HOME/.open-cc}"
BIN_DIR="${OPEN_CC_BIN_DIR:-$HOME/.local/bin}"
BRANCH="${OPEN_CC_BRANCH:-main}"

echo "Installing open-cc to $INSTALL_DIR..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js >= 18 first."
    exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v//g' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "Error: Node.js >= 18 is required. Found $(node -v)"
    exit 1
fi

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Updating existing installation at $INSTALL_DIR..."
    cd "$INSTALL_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
else
    rm -rf "$INSTALL_DIR"
    git clone --branch "$BRANCH" https://github.com/Stephen-SMJ/open-cc.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Install dependencies & build
npm install
npm run build

# Link binary
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/dist/entrypoints/cli.js" "$BIN_DIR/open-cc"

echo ""
echo "✅ open-cc installed successfully!"

# PATH warning
if ! command -v open-cc &> /dev/null; then
    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        echo ""
        echo "⚠️  $BIN_DIR is not in your PATH."
        echo "Add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
        echo ""
        echo "  export PATH=\"\$PATH:$BIN_DIR\""
        echo ""
        echo "Then reload your shell: source ~/.bashrc  (or ~/.zshrc)"
    fi
fi

echo ""
echo "Quick start:"
echo "  export OPENAI_API_KEY=sk-..."
echo "  open-cc"

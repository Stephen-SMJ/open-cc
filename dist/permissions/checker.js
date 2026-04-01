export class PermissionChecker {
    mode = 'default';
    alwaysAllow = new Set();
    setMode(mode) {
        this.mode = mode;
    }
    canAutoApprove(tool) {
        if (this.mode === 'auto')
            return true;
        if (tool.isReadOnly)
            return true;
        if (this.alwaysAllow.has(tool.name))
            return true;
        return false;
    }
    approveForSession(toolName) {
        this.alwaysAllow.add(toolName);
    }
    reset() {
        this.alwaysAllow.clear();
    }
}

# Changelog

All notable changes to Terminal. Full commit history in chronological order.

Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

None

## [0.1.0] - 2026-04-26

### Added

- Initial release of @neabyte/terminal
- Terminal class with static methods:
  - `execute()` - Execute command with security validation
  - `kill()` - Terminate running process
  - `getOutput()` - Retrieve captured stdout/stderr
  - `getList()` - List all tracked processes
  - `getExitCode()` - Get process exit code
  - `stream()` - Attach real-time output callbacks
  - `initialize()` - Configure security policies
  - `getConfig()` - Get current configuration
  - `setConfig()` - Update configuration dynamically
- Manager class for process lifecycle:
  - Process registry with unique IDs (`term_<uuid>`)
  - Background execution support (non-blocking)
  - `killAllProcesses()` - Bulk termination
  - `isProcessRunning()` - Status checking
  - `setProcessTimeout()` - Per-process timeout scheduling
  - Auto-cleanup 5s after process exit
- Validator class for security:
  - ACL pattern matching with wildcards (`*`)
  - Deny-first priority (deny overrides allow)
  - Command whitelist/denylist
  - Workspace path validation with traversal detection
  - Environment variable filtering (allow/deny patterns)
  - Argument count limiting (`maxArgs`)
  - Shell metacharacter detection (`;`, `|`, `&`, etc.)
  - Path traversal prevention (`../`, `..\`)
  - Null byte injection protection
- Command execution features:
  - Quoted argument parsing (single and double quotes)
  - Per-command timeout override
  - Real-time streaming callbacks (`onStdout`, `onStderr`, `onExit`)
  - SIGTERM to SIGKILL escalation (2s grace period)
  - AbortController cancellation support
  - `shell: false` direct execution (no shell interpolation)
  - `detached: false` for parent group tracking
- TypeScript interfaces:
  - `TerminalConfig` - Complete configuration types
  - `ExecuteOptions` - Per-command options
  - `ExecuteResult` - Execution return type
  - `ProcessInfo` - Process metadata
  - `ValidationResult` - Validation return types
- Test suites:
  - Security tests (injection, traversal, bypass attempts)
  - Functional tests (process management, execution)
  - Validator unit tests (patterns, environment, workspace)

### Security

- Enforce `shell: false` to prevent shell metacharacter injection
- Validate all arguments against dangerous characters (`;`, `|`, `&`, `` ` ``, `$()`, etc.)
- Block path traversal attempts (`../`) in arguments and paths
- Restrict execution to configured workspaces only
- Filter environment variables with allow/deny lists
- Limit maximum argument count to prevent abuse
- Use detached: false to keep processes in parent group for tracking

---

[Unreleased]: https://github.com/NeaByteLab/Terminal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/NeaByteLab/Terminal/releases/tag/v0.1.0

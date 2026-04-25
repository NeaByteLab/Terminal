# Changelog

All notable changes to Terminal. Full commit history in chronological order.

Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

## [0.1.0] - 2026-04-25

### Added

- Initial release of @neabyte/terminal
- Terminal class with execute, kill, getOutput, getList, stream methods
- Manager class for process lifecycle and registry with unique IDs
- Validator class with ACL pattern matching and wildcard support
- Command whitelist/denylist for controlling allowed commands
- Workspace sandboxing restricting execution to allowed directories
- Environment variable filtering with allow/deny patterns
- Real-time output streaming with callback support
- Timeout-based automatic process termination
- Shell injection protection via metacharacter detection
- Path traversal prevention in arguments and paths
- SIGTERM to SIGKILL escalation for reliable process termination
- AbortController integration for cancellation support
- TypeScript interfaces for configuration and process types
- Security test suite covering injection and bypass attempts
- Functional test suite for process management

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

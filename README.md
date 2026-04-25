<div align="center">

# Terminal

[![Deno](https://img.shields.io/badge/deno-2.0+-000000?logo=deno&logoColor=white)](https://deno.com) [![JSR](https://jsr.io/badges/@neabyte/terminal)](https://jsr.io/@neabyte/terminal) [![npm](https://img.shields.io/badge/npm-%40neabyte%2Fterminal-blue?logo=npm)](https://www.npmjs.com/package/@neabyte/terminal) [![CI](https://github.com/NeaByteLab/Terminal/actions/workflows/ci.yaml/badge.svg)](https://github.com/NeaByteLab/Terminal/actions/workflows/ci.yaml) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Secure command sandbox preventing AI destructive code deletions

<img src="./assets/preview.webp" alt="Terminal Preview" width="100%">

**Goal Frustration Collapse** is when LLMs panic and delete your code because they cannot figure things out. This library blocks every destructive escape route so your files stay safe even when AI loses it.

</div>

## Features

- **Security-First** - Prevents injection attacks and validates commands
- **Workspace Sandboxing** - Commands restricted to allowed directories only
- **Command Whitelist** - Pattern-based command filtering with wildcard support
- **Process Management** - Track processes using their unique IDs
- **Environment Filtering** - Filter environment variables with allow/deny rules
- **Timeout Protection** - Automatic process termination after configurable timeout
- **Argument Validation** - Limit arguments and block dangerous characters
- **Real-Time Streaming** - Stream stdout/stderr with callback support

## Installation

> [!NOTE]
> **Prerequisites:** [Deno](https://deno.com/) 2.0+ or [Node.js](https://nodejs.org/) 20+.

**Deno (JSR)**

```bash
deno add jsr:@neabyte/terminal
```

**npm/Node.js**

```bash
npm install @neabyte/terminal
```

## Quick Start

### 1. Import Module

```typescript
// Default import (works in both Deno and Node.js)
import Terminal from '@neabyte/terminal'

// or named export
import { Terminal } from '@neabyte/terminal'
```

### 2. Configure Execute

```typescript
// Initialize with security configuration
Terminal.initialize({
  workspaces: ['/safe/project'],
  commands: {
    allow: ['cd *', 'node *', 'deno *'],
    deny: ['rm *', 'sudo *'],
    maxArgs: 10,
    strictArgs: true,
    noShell: true
  },
  env: {
    allow: ['NODE_ENV', 'PATH'],
    deny: ['HOME', 'SSH_*']
  },
  timeout: 30000
})

// Execute a command
const result = await Terminal.execute('deno --version')
console.log(result.stdout)

// Execute in background
const { id } = await Terminal.execute('long-running-task', { background: true })

// Get output later
const output = Terminal.getOutput(id)

// Kill if needed
Terminal.kill(id)
```

## Security Features

### Command Validation

```typescript
Terminal.initialize({
  commands: {
    allow: ['git *', 'npm *', 'node *'], // Allowed patterns
    deny: ['rm -rf *', 'sudo *'], // Blocked patterns
    maxArgs: 10, // Limit argument count
    strictArgs: true, // Block shell metacharacters
    noShell: true // Direct execution, no shell
  }
})
```

### Workspace Sandboxing

```typescript
Terminal.initialize({
  workspaces: ['/home/user/projects'] // Commands only work here
})

// This will fail if outside allowed workspaces
await Terminal.execute('ls -la', { cwd: '/etc' })
```

### Environment Filtering

```typescript
Terminal.initialize({
  env: {
    allow: ['NODE_ENV', 'PATH'], // Only these allowed
    deny: ['HOME', 'SSH_*', 'AWS_*'] // These explicitly blocked
  }
})
```

## Process Management

```typescript
// List all tracked processes
const processes = Terminal.getList()
// [{ id: 'term_...', command: 'node', args: ['server.js'], running: true, ... }]

// Get exit code
const exitCode = Terminal.getExitCode(processId)

// Stream output in real-time
Terminal.stream(
  processId,
  data => console.log('stdout:', data),
  data => console.error('stderr:', data)
)

// Kill process (SIGTERM, then SIGKILL after 2s)
Terminal.kill(processId)
```

## Build & Test

From the repo root (requires [Deno](https://deno.com/)).

**Check** - format, lint, and typecheck:

```bash
# Format, lint, and typecheck source
deno task check
```

**Test** - run tests:

```bash
# Run tests in tests/
deno task test
```

## Purpose & Usage

Terminal implements **Access Control Lists (ACL)** for command execution. It validates every command against configurable allow/deny patterns before execution, preventing destructive operations like `rm -rf /` or unauthorized file access.

**Common use cases:**

- **AI Agent Sandboxing** - Block LLMs from code deletion during frustration
- **CI/CD Pipelines** - Restrict build scripts to safe commands only
- **Plugin Systems** - Isolate untrusted code within workspace boundaries
- **Remote Execution** - Prevent shell injection inside user-submitted commands

See [full documentation](docs/README.md) for advanced configuration including:

- Custom command patterns with wildcards
- Environment variable filtering
- Process timeout policies
- Workspace path validation

## Contributing

- **Bugs & ideas** - [GitHub Issues](https://github.com/NeaByteLab/Terminal/issues)
- **Code & docs** - [Pull Requests](https://github.com/NeaByteLab/Terminal/pulls) welcome.
- **Use it** - Try Terminal in your projects and share feedback.

## License

This project is licensed under the MIT license. See [LICENSE](LICENSE) for details.

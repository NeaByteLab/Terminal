# API Reference

Complete API documentation for the Terminal class.

## Terminal Class

Main entry point. Static class with singleton configuration.

### Methods

#### initialize(config?)

Set up Terminal with security configuration. Merges with defaults.

```typescript
Terminal.initialize({
  workspaces: ['/safe/project'],
  commands: { allow: ['node *'], deny: ['rm *'] }
})
```

#### execute(command, options?)

Execute a command after security validation.

```typescript
const result = await Terminal.execute('node server.js', {
  cwd: '/safe/project',
  timeout: 60000,
  background: false
})

// Result: { id, exitCode, stdout, stderr }
```

**Options:**

- `cwd` - Working directory (validated against workspaces)
- `timeout` - Override global timeout (ms)
- `background` - Return immediately without waiting
- `stream` - Enable streaming callbacks
- `onStdout`, `onStderr`, `onExit` - Callbacks

#### kill(id)

Kill a running process.

```typescript
Terminal.kill('term_abc123')
// Returns: boolean (true if killed)
```

Sends SIGTERM first, then SIGKILL after 2 seconds if still running.

#### getOutput(id)

Get captured stdout and stderr.

```typescript
const { stdout, stderr } = Terminal.getOutput('term_abc123')
```

#### getList()

List all tracked processes.

```typescript
const processes = Terminal.getList()
// Returns: [{ id, command, args, pid, startTime, background, running }]
```

#### getExitCode(id)

Get exit code for a completed process.

```typescript
const code = Terminal.getExitCode('term_abc123') // number | null
```

#### stream(id, onStdout, onStderr)

Attach streaming callbacks to a running process.

```typescript
Terminal.stream(
  'term_abc123',
  data => console.log('out:', data),
  data => console.error('err:', data)
)
```

#### getConfig()

Get current configuration copy.

```typescript
const config = Terminal.getConfig()
```

#### setConfig(config)

Update configuration partially.

```typescript
Terminal.setConfig({ timeout: 60000 })
```

## Types

Exported via `Types` namespace:

```typescript
import type { TerminalConfig, ExecuteOptions, ExecuteResult } from '@neabyte/terminal'
```

### TerminalConfig

```typescript
interface TerminalConfig {
  workspaces: string[]
  commands: CommandConfig
  env: EnvConfig
  timeout: number
}
```

### CommandConfig

```typescript
interface CommandConfig {
  allow: string[] // Allowed patterns
  deny: string[] // Blocked patterns
  maxArgs: number // Max argument count
  strictArgs: boolean // Block metacharacters
  noShell: boolean // Direct execution
}
```

### EnvConfig

```typescript
interface EnvConfig {
  allow: string[] // Allowed variable patterns
  deny: string[] // Blocked variable patterns
}
```

### ExecuteOptions

```typescript
interface ExecuteOptions {
  cwd?: string
  timeout?: number
  background?: boolean
  stream?: boolean
  onStdout?: (data: string) => void
  onStderr?: (data: string) => void
  onExit?: (code: number | null, signal: string | null) => void
}
```

### ExecuteResult

```typescript
interface ExecuteResult {
  id: string
  exitCode: number | null
  stdout: string
  stderr: string
}
```

## See Also

- [Configuration](./configuration.md) - Config options explained
- [Security](./security.md) - Security concepts

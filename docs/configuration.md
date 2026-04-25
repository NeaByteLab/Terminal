# Configuration

Terminal uses a configuration object to define security policies. All settings are optional and merge with sensible defaults.

## Basic Configuration

```typescript
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
```

## Workspaces

Restrict command execution to specific directories:

```typescript
workspaces: ['/home/user/projects', '/tmp/builds']
```

Commands outside these paths will be rejected.

## Commands

### allow - Command Whitelist

Pattern-based allowlist. Empty array allows all (unless denied).

```typescript
allow: ['git *', 'npm *', 'node *.js', 'deno run *']
```

### deny - Command Blacklist

Pattern-based denylist. Always checked first.

```typescript
deny: ['rm -rf *', 'sudo *', 'mkfs.*', 'dd *']
```

### maxArgs - Argument Limit

Maximum number of arguments allowed per command.

```typescript
maxArgs: 10 // Rejects commands with more than 10 arguments
```

### strictArgs - Strict Validation

Block shell metacharacters in arguments:

```typescript
strictArgs: true // Blocks ; | & ` $ ( ) { } [ ] < >
```

### noShell - Shell Control

```typescript
noShell: true // Always use direct execution (recommended)
```

## Environment Variables

### allow - Variable Whitelist

```typescript
allow: ['NODE_ENV', 'PATH', 'HOME']
```

### deny - Variable Blacklist

Supports wildcards:

```typescript
deny: ['SSH_*', 'AWS_*', 'TOKEN*']
```

## Timeout

Default timeout in milliseconds:

```typescript
timeout: 30000 // 30 seconds
```

Set to `0` to disable timeouts.

## Pattern Syntax

Patterns use token matching with optional wildcards:

- `git *` - Matches "git" followed by any arguments
- `node *.js` - Matches "node" with .js file argument
- `deno run *` - Matches exact prefix, allows suffix

## See Also

- [Security](./security.md) - Deep dive into security concepts
- [API Reference](./api-reference.md) - Programmatic config updates

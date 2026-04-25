# Security

Terminal implements a defense-in-depth security model to prevent command injection, path traversal, and destructive operations.

## Goal Frustration Collapse

**Goal Frustration Collapse** occurs when AI agents panic and attempt destructive operations like deleting files or running dangerous commands when they cannot solve a problem. Terminal blocks these escape routes through multiple validation layers.

## Access Control Lists (ACL)

Terminal uses ACL-based security:

1. **Deny-First Policy** - Blocked commands are rejected immediately
2. **Allow-List Enforcement** - Only explicitly allowed commands pass
3. **Workspace Sandboxing** - Commands restricted to approved directories
4. **Environment Isolation** - Sensitive env vars filtered out

## Threat Model

### Defended Against

- **Shell Injection** - `; rm -rf /` in arguments
- **Command Chaining** - `||` and `&&` exploitation
- **Path Traversal** - `../../../etc/passwd` access
- **Variable Expansion** - `$()` and backtick injection
- **Destructive Commands** - `rm`, `mkfs`, `dd` on wrong targets

### Attack Vectors Blocked

```typescript
// Shell injection
await Terminal.execute('echo; rm -rf /') // Blocked by strictArgs

// Path traversal
await Terminal.execute('cat ../../../etc/passwd') // Blocked by path traversal check

// Variable expansion
await Terminal.execute('echo $(whoami)') // Blocked by strictArgs
```

## Best Practices

### 1. Always Use noShell: true

Direct execution prevents shell interpretation attacks.

### 2. Restrict Workspaces

Limit to minimum required directories.

### 3. Explicit Deny List

Always block known-dangerous commands:

```typescript
deny: ['rm -rf *', 'sudo *', 'mkfs.*', 'dd *', 'chmod -R *']
```

### 4. Filter Environment

Remove sensitive variables:

```typescript
deny: ['SSH_*', 'AWS_*', 'TOKEN*', 'SECRET*', 'PASSWORD*']
```

### 5. Set Reasonable Timeouts

Prevent runaway processes:

```typescript
timeout: 30000 // 30 seconds max
```

## Security Architecture

### Validation Order

1. Command pattern matching (deny then allow)
2. Argument count validation
3. Shell metacharacter scan
4. Path traversal detection
5. Workspace path validation
6. Environment variable filtering
7. **Then** execute with `shell: false`

### Process Isolation

- `detached: false` - Process in parent group
- `stdio: ['ignore', 'pipe', 'pipe']` - No inherited streams
- `AbortController` - Reliable termination

## See Also

- [Configuration](./configuration.md) - Configure security settings
- [API Reference](./api-reference.md) - Security-related APIs

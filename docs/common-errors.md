# Common Errors

Troubleshooting guide for frequent issues when using Terminal.

## Command Not Allowed

`Command not allowed: <command>`

**Cause**: The command is not in your `allow` list or is in `deny` list.

**Fix**:

```typescript
Terminal.initialize({
  commands: {
    allow: ['echo *', 'git *', 'your-command *'] // Add your command
  }
})
```

## Workspace Not Allowed

`Workspace validation failed: <path>`

**Cause**: Executing outside configured workspaces.

**Fix**:

```typescript
Terminal.initialize({
  workspaces: ['/your/working/directory'] // Add your path
})

// Or use cwd option
await Terminal.execute('command', { cwd: '/allowed/path' })
```

## Argument Validation Failed

`Argument validation failed: Too many arguments`

**Cause**: More arguments than `maxArgs` limit.

**Fix**:

```typescript
Terminal.initialize({
  commands: {
    maxArgs: 20 // Increase limit
  }
})
```

## Shell Metacharacters Detected

`Argument validation failed: Invalid characters in argument`

**Cause**: Arguments contain `;`, `|`, `&`, `` ` ``, `$()`, etc.

**Fix**:

- Disable strict validation (not recommended): `strictArgs: false`
- Or sanitize your input before passing to Terminal

## Pipeline Not Working

**Symptom**: `yes | head` or `cat file | grep` fails

**Cause**: `noShell: true` disables shell features including pipes.

**Fix**:

- Use single commands only with `noShell: true`
- Or use Node.js streams for piping:

```typescript
const { stdout } = await Terminal.execute('cat file', { cwd: '/tmp' })
const filtered = stdout.split('\n').filter(line => line.includes('pattern'))
```

## Process Not Found

`Process not found: <id>`

**Cause**: Process ID expired (auto-cleanup after 5 seconds post-exit).

**Fix**: Check output immediately after process completes:

```typescript
const { id } = await Terminal.execute('command', { background: true })
await new Promise(r => setTimeout(r, 1000)) // Wait for completion
const output = Terminal.getOutput(id) // Get before cleanup
```

## ESM Import Error (Node.js)

`Error [ERR_REQUIRE_ESM]: require() of ES Module`

**Cause**: Using `require()` instead of `import`.

**Fix**: Use ES Module syntax:

```typescript
import Terminal from '@neabyte/terminal'
```

## Timeout Error

Process killed after timeout

**Cause**: Command exceeded `timeout` limit (default 30s).

**Fix**:

```typescript
Terminal.initialize({
  timeout: 60000 // Increase to 60s
})

// Or per-command
await Terminal.execute('long-command', { timeout: 120000 })
```

## See Also

- [Configuration](./configuration.md) - Adjust settings to prevent errors
- [Security](./security.md) - Understand why certain restrictions exist

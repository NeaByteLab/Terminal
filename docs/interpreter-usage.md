# Interpreter Usage

Guide for running language interpreters (Deno, Python, Node.js) through Terminal's security sandbox.

## The StrictArgs Challenge

With `strictArgs: true` (default), shell metacharacters including parentheses `()` are blocked. This affects inline code execution:

```typescript
// BLOCKED - Parentheses detected as shell metacharacters
await Terminal.execute('python3 -c print(42)')
await Terminal.execute('deno eval console.log(42)')
await Terminal.execute('node -e console.log(42)')
```

**Error**: `Argument validation failed: Invalid characters in argument 1: shell metacharacters detected`

## Solution 1: Disable Strict Validation (Less Secure)

For trusted environments only:

```typescript
Terminal.initialize({
  workspaces: ['/safe/project'],
  commands: {
    allow: ['deno', 'python3', 'node'],
    deny: ['sudo'],
    maxArgs: 20,
    strictArgs: false, // Allow () for function calls
    noShell: true
  }
})

// Now works
await Terminal.execute('python3 -c print(42)')
```

> [!WARNING]
> **Security Risk**: Disables protection against shell injection. Only use in controlled environments.

## Solution 2: File-Based Execution (Recommended)

Write code to file first, then execute:

```typescript
// Write script to allowed workspace
const scriptPath = '/safe/project/script.py'
await Deno.writeTextFile(
  scriptPath,
  `
import sys
print(f"Python {sys.version}")
for i in range(3):
    print(f"Line {i + 1}")
`
)

// Execute the file
const result = await Terminal.execute(`python3 ${scriptPath}`)
console.log(result.stdout)
```

**Benefits**:

- No metacharacter issues
- Cleaner code formatting
- Reusable scripts
- Better error handling

## Solution 3: Use Pre-Installed Scripts

For common operations, prepare scripts in advance:

```typescript
// /safe/project/scripts/check-version.py exists
const result = await Terminal.execute('python3 /safe/project/scripts/check-version.py')
```

## Command Parser Behavior

Terminal's parser splits commands on **whitespace only**:

| Input        | Parsed As                 | Note                    |
| ------------ | ------------------------- | ----------------------- |
| `echo a b c` | `['echo', 'a', 'b', 'c']` | ✅ Works                |
| `echo a,b,c` | `['echo', 'a,b,c']`       | ✅ Comma stays in arg   |
| `cmd; rm /`  | `['cmd;', 'rm', '/']`     | ❌ `;` is part of arg 0 |
| `a && b`     | `['a', '&&', 'b']`        | ❌ `&&` becomes arg 1   |

**Shell operators do NOT work** (even with `strictArgs: false`):

```typescript
// Parsed as separate args, NOT chained commands
await Terminal.execute('deno eval console.log(1), console.log(2)')
// Args: ['deno', 'eval', 'console.log(1),', 'console.log(2)']
// The comma stays attached to arg 2
```

## Complete Example

```typescript
import Terminal from '@neabyte/terminal'

Terminal.initialize({
  workspaces: ['/workspace'],
  commands: {
    allow: ['deno', 'python3'],
    deny: ['sudo'],
    maxArgs: 5,
    strictArgs: true,
    noShell: true
  },
  timeout: 10000
})

// Create Python script
await Deno.writeTextFile(
  '/workspace/hello.py',
  `
import sys

def main():
    print("Hello from Python!")
    print(f"Arguments: {sys.argv[1:]}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
`
)

// Execute safely
const result = await Terminal.execute('python3 /workspace/hello.py arg1 arg2')
console.log(result.stdout)
console.log('Exit code:', result.exitCode)
```

## Best Practices

1. **Always use `noShell: true`** - Prevents shell interpretation attacks
2. **Prefer file-based over inline** - Cleaner, safer, more maintainable
3. **Restrict workspaces strictly** - Only allow necessary directories
4. **Clean up temp files** - Remove scripts after execution
5. **Use wildcards in allowlist** - `python3 /workspace/*.py` for flexibility

## See Also

- [Configuration](./configuration.md) - Security settings reference
- [Security](./security.md) - Understanding `strictArgs` protection
- [Common Errors](./common-errors.md) - Troubleshooting guide

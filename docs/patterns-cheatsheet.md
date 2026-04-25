# Patterns Cheatsheet

Quick reference for command patterns in Terminal.

## Wildcard Syntax

| Pattern      | Matches                        | Example                                             |
| ------------ | ------------------------------ | --------------------------------------------------- |
| `git *`      | `git` + any arguments          | `git status`, `git commit -m "msg"`                 |
| `node *.js`  | `node` + files ending in `.js` | `node app.js`, `node server.js`                     |
| `deno run *` | `deno run` + any               | `deno run app.ts`, `deno run --allow-net server.ts` |
| `npm *`      | `npm` + any subcommand         | `npm install`, `npm run build`                      |
| `echo *`     | `echo` + any text              | `echo hello`, `echo "hello world"`                  |

## Token Matching

Patterns are matched token by token (space-separated):

```typescript
// Pattern: ['git status *']
// Matches:
//   git status              // No
//   git status --short      // Yes
//   git status file.txt     // Yes

// Pattern: ['git *']
// Matches ALL git commands:
//   git status              // Yes
//   git commit              // Yes
//   git log --oneline       // Yes
```

## Common Patterns

### Safe Development Commands

```typescript
allow: [
  'git *', // Version control
  'npm *', // Node package manager
  'node *.js', // Run JS files only
  'deno run *', // Deno execution
  'echo *', // Safe output
  'cat *', // Read files (use carefully)
  'ls *', // List directory
  'pwd' // Print working directory
]
```

### Strict Build Environment

```typescript
allow: [
  'npm run build',
  'npm run test',
  'npm run lint',
  'node dist/*.js' // Only run compiled files
]
```

## Dangerous Patterns to Deny

Always include these in `deny`:

```typescript
deny: [
  'rm -rf *', // Recursive delete
  'sudo *', // Privilege escalation
  'mkfs.*', // Format filesystem
  'dd *', // Direct disk access
  'chmod -R *', // Mass permission change
  'mv * /', // Move to root
  'cp * /', // Copy to root
  '> *', // Overwrite redirect (if shell enabled)
  '* > /etc/*' // Write to system files
]
```

## Pattern Priority

Deny is always checked FIRST:

1. If command matches `deny` = **BLOCKED**
2. If `allow` is empty = **ALLOWED**
3. If command matches `allow` = **ALLOWED**
4. If no match = **BLOCKED**

## Testing Patterns

```typescript
// Quick test your patterns
Terminal.initialize({
  workspaces: ['/tmp'],
  commands: { allow: ['your-pattern *'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
})

try {
  await Terminal.execute('your-command test', { cwd: '/tmp' })
  console.log('Pattern MATCHED')
} catch (e) {
  console.log('Pattern BLOCKED:', (e as Error).message)
}
```

## See Also

- [Configuration](./configuration.md) - Full config options
- [Security](./security.md) - Why restrictions matter

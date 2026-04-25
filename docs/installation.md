# Installation

Terminal supports both Deno (via JSR) and Node.js (via npm).

## Prerequisites

- **Deno**: 2.0 or later
- **Node.js**: 20.0 or later

## Deno (JSR)

```bash
deno add jsr:@neabyte/terminal
```

Then import in your code:

```typescript
import Terminal from '@neabyte/terminal'
```

## Node.js (npm)

```bash
npm install @neabyte/terminal
```

Then import in your code:

```typescript
import Terminal from '@neabyte/terminal'
```

## Verify Installation

```typescript
import Terminal from '@neabyte/terminal'

console.log(Terminal.getConfig())
// Should output default configuration
```

## Troubleshooting

### Deno: Cannot find module

Ensure your `deno.json` has the proper imports or use bare specifier after `deno add`.

### Node.js: ESM imports

This package is ESM-only. Use `import` syntax, not `require`.

## Next Steps

- [Configuration](./configuration.md) - Learn how to configure security settings
- [Security](./security.md) - Understand the security model

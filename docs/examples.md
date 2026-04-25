# Examples

Real-world usage examples for Terminal.

## AI Agent Integration

Protect your AI agent from destructive actions:

```typescript
import Terminal from '@neabyte/terminal'

// Lock down the environment
Terminal.initialize({
  workspaces: ['/home/ai-agent/projects'],
  commands: {
    allow: ['git *', 'npm *', 'node *.js', 'deno run *', 'echo *'],
    deny: ['rm -rf *', 'sudo *', 'chmod -R *', 'mv * /'],
    maxArgs: 20,
    strictArgs: true,
    noShell: true
  },
  env: {
    allow: ['NODE_ENV', 'PATH'],
    deny: ['HOME', 'SSH_*', 'AWS_*', 'TOKEN*']
  },
  timeout: 30000
})

// Safe execution wrapper for AI
export async function safeExecute(command: string): Promise<string> {
  try {
    const result = await Terminal.execute(command, {
      cwd: '/home/ai-agent/projects',
      timeout: 10000
    })
    return result.stdout
  } catch (error) {
    return `Error: ${(error as Error).message}. Command blocked for safety.`
  }
}
```

## CI/CD Pipeline

Restrict build scripts to safe commands:

```typescript
import Terminal from '@neabyte/terminal'

Terminal.initialize({
  workspaces: ['/workspace'],
  commands: {
    allow: [
      'npm run *',       // Build scripts only
      'npm install',
      'npm ci',
      'node dist/*.js',
      'echo *',
      'ls *'
    ],
    deny: [
      'npm publish',     // Prevent accidental publishes
      'npm unpublish',
      'rm -rf *',
      'git push *',
      'git reset *'
    ],
    maxArgs: 10,
    strictArgs: true,
    noShell: true
  },
  timeout: 300000  // 5 minutes for builds
})

// Run build
async function runBuild(): Promise<boolean> {
  try {
    const result = await Terminal.execute('npm run build', {
      cwd: '/workspace'
    })
    return result.exitCode === 0
  } catch (error) {
    console.error('Build failed:', (error as Error).message)
    return false
  }
}
```

## Plugin System

Sandbox untrusted plugins:

```typescript
import Terminal from '@neabyte/terminal'

class PluginSandbox {
  private pluginId: string

  constructor(pluginId: string, allowedDir: string) {
    this.pluginId = pluginId
    
    Terminal.initialize({
      workspaces: [allowedDir],
      commands: {
        allow: ['echo *', 'cat *', 'ls *'],  // Read-only
        deny: ['rm *', 'mv *', 'cp *', 'write *', '> *'],
        maxArgs: 5,
        strictArgs: true,
        noShell: true
      },
      timeout: 10000
    })
  }

  async runPluginCommand(command: string): Promise<string> {
    console.log(`[Plugin ${this.pluginId}] Running: ${command}`)
    
    const result = await Terminal.execute(command, {
      background: false,
      timeout: 5000
    })
    
    return result.stdout
  }
}
```

## Remote Code Execution Server

Accept user commands safely:

```typescript
import Terminal from '@neabyte/terminal'
import { serve } from 'https://deno.land/std/http/server.ts'

Terminal.initialize({
  workspaces: ['/sandbox'],
  commands: {
    allow: ['python3 *.py', 'node *.js', 'deno run *', 'echo *'],
    deny: ['*../../*', 'sudo *', 'rm -rf *', 'wget *', 'curl *'],
    maxArgs: 10,
    strictArgs: true,
    noShell: true
  },
  timeout: 10000
})

async function handleRequest(req: Request): Promise<Response> {
  const body = await req.json()
  const { command } = body

  try {
    const result = await Terminal.execute(command, {
      cwd: '/sandbox',
      background: false,
      timeout: 10000
    })

    return new Response(JSON.stringify({
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode
    }))
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), { status: 400 })
  }
}

serve(handleRequest, { port: 8000 })
```

## File Watcher with Safe Commands

Run commands on file changes:

```typescript
import Terminal from '@neabyte/terminal'

Terminal.initialize({
  workspaces: ['/project'],
  commands: {
    allow: ['npm run build', 'npm run test', 'echo *'],
    deny: ['rm *', 'sudo *'],
    maxArgs: 5,
    strictArgs: true,
    noShell: true
  }
})

// Watch and rebuild
async function onFileChange(filepath: string): Promise<void> {
  if (filepath.endsWith('.ts')) {
    console.log('TypeScript file changed, rebuilding...')
    
    const result = await Terminal.execute('npm run build', {
      cwd: '/project',
      timeout: 60000
    })
    
    if (result.exitCode === 0) {
      console.log('Build successful')
    } else {
      console.error('Build failed:', result.stderr)
    }
  }
}
```

## Process Monitoring Dashboard

Track multiple background tasks:

```typescript
import Terminal from '@neabyte/terminal'

async function runMonitoredTasks(): Promise<void> {
  // Start multiple background processes
  const tasks = [
    { name: 'Database', cmd: 'docker start postgres' },
    { name: 'Cache', cmd: 'docker start redis' },
    { name: 'Server', cmd: 'node server.js' }
  ]

  for (const task of tasks) {
    const { id } = await Terminal.execute(task.cmd, {
      cwd: '/project',
      background: true
    })
    console.log(`Started ${task.name}: ${id}`)
  }

  // Monitor loop
  setInterval(() => {
    const processes = Terminal.getList()
    console.log('\n--- Active Processes ---')
    for (const proc of processes) {
      console.log(`${proc.id}: ${proc.command} (${proc.running ? 'running' : 'stopped'})`)
    }
  }, 5000)
}
```

## See Also

- [Configuration](./configuration.md) - Customize for your use case
- [Security](./security.md) - Understand the protection model
- [Common Errors](./common-errors.md) - Troubleshoot issues

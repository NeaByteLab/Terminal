import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import { Terminal } from '@app/index.ts'

Deno.test('Terminal - default config structure', () => {
  const config = Terminal.getConfig()
  assertEquals(config.workspaces, [])
  assertEquals(config.commands.maxArgs, 10)
  assertEquals(config.commands.strictArgs, true)
  assertEquals(config.commands.noShell, true)
  assertEquals(config.commands.allow, [])
  assertEquals(config.commands.deny, [])
  assertEquals(config.env.allow, ['NODE_ENV', 'PATH'])
  assertEquals(config.env.deny, ['HOME', 'SSH_*'])
  assertEquals(config.timeout, 30000)
})

Deno.test(
  'Terminal.execute - background execution returns immediately',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], maxArgs: 2, deny: [], strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('sleep 5', { cwd: '/tmp', background: true })
    assert(result.id.startsWith('term_'))
  }
)

Deno.test(
  'Terminal.execute - captures exit code',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['false', 'true'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const falseResult = await Terminal.execute('false', { cwd: '/tmp', timeout: 5000 })
    assertEquals(falseResult.exitCode, 1)
    const trueResult = await Terminal.execute('true', { cwd: '/tmp', timeout: 5000 })
    assertEquals(trueResult.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - executes real echo command',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 5, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo hello world', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
    assert(result.stdout.includes('hello world'))
  }
)

Deno.test(
  'Terminal.execute - parses quoted arguments',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 5, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo "hello world"', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
    assert(result.stdout.includes('hello world'))
  }
)

Deno.test(
  'Terminal.execute - respects timeout',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    await assertRejects(async () => {
      await Terminal.execute('sleep 10', { cwd: '/tmp', timeout: 100 })
    }, Error)
  }
)

Deno.test(
  'Terminal.execute - throws on denied command',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: [], deny: ['rm'], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('rm -rf /', { cwd: '/tmp', timeout: 5000 }),
      Error,
      'Command not allowed'
    )
  }
)

Deno.test(
  'Terminal.execute - throws on invalid workspace',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/allowed'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('echo test', { cwd: '/tmp', timeout: 5000 }),
      Error,
      'Workspace validation failed'
    )
  }
)

Deno.test(
  'Terminal.execute - throws on too many args',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { maxArgs: 2, strictArgs: true, allow: ['echo'], deny: [], noShell: true }
    })
    assertThrows(
      () => Terminal.execute('echo a b c d', { cwd: '/tmp', timeout: 5000 }),
      Error,
      'Too many arguments'
    )
  }
)

Deno.test('Terminal.getExitCode - returns null for unknown process', () => {
  const code = Terminal.getExitCode('nonexistent')
  assertEquals(code, null)
})

Deno.test('Terminal.getList - returns process array', () => {
  const list = Terminal.getList()
  assert(Array.isArray(list))
})

Deno.test('Terminal.getOutput - returns empty for unknown process', () => {
  const output = Terminal.getOutput('nonexistent')
  assertEquals(output, { stdout: '', stderr: '' })
})

Deno.test('Terminal.initialize - merges partial config', () => {
  Terminal.initialize({
    workspaces: ['/tmp'],
    commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true },
    timeout: 10000
  })
  const config = Terminal.getConfig()
  assertEquals(config.workspaces, ['/tmp'])
  assertEquals(config.timeout, 10000)
  assertEquals(config.commands.allow, ['echo'])
})

Deno.test(
  'Terminal.kill - kills running process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('sleep 10', { cwd: '/tmp', background: true })
    assert(Terminal.kill(result.id))
    await new Promise(r => setTimeout(r, 500))
    assert(!Terminal.getList().find(p => p.id === result.id)?.running)
  }
)

Deno.test('Terminal.kill - returns false for unknown process', () => {
  const result = Terminal.kill('nonexistent')
  assertEquals(result, false)
})

Deno.test('Terminal.setConfig - updates existing config', () => {
  Terminal.initialize({ workspaces: ['/initial'] })
  Terminal.setConfig({ workspaces: ['/updated'], timeout: 5000 })
  const config = Terminal.getConfig()
  assertEquals(config.workspaces, ['/updated'])
  assertEquals(config.timeout, 5000)
})

Deno.test(
  'Terminal.stream - streams output from real process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo streamed', { cwd: '/tmp', background: true })
    let received = ''
    Terminal.stream(
      result.id,
      data => {
        received += data
      },
      () => {}
    )
    await new Promise(r => setTimeout(r, 500))
    assert(received.includes('streamed'))
  }
)

Deno.test('Terminal.stream - throws for unknown process', () => {
  assertThrows(
    () =>
      Terminal.stream(
        'unknown',
        () => {},
        () => {}
      ),
    Error,
    'Process not found'
  )
})

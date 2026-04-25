import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import Helpers from '@tests/helpers/index.ts'
import Terminal from '@app/index.ts'

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
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [Helpers.sleep], maxArgs: 3, deny: [], strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute(`${Helpers.sleep} 5`, { cwd: tempDir, background: true })
    assert(result.id.startsWith('term_'))
  }
)

Deno.test(
  'Terminal.execute - captures exit code',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.fail, Helpers.success],
        deny: [],
        maxArgs: 10,
        strictArgs: true,
        noShell: true
      }
    })
    const failResult = await Terminal.execute(`${Helpers.fail} ${Helpers.failArgs.join(' ')}`, {
      cwd: tempDir,
      timeout: 5000
    })
    assertEquals(failResult.exitCode, 1)
    const successResult = await Terminal.execute(
      `${Helpers.success} ${Helpers.successArgs.join(' ')}`,
      { cwd: tempDir, timeout: 5000 }
    )
    assertEquals(successResult.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - executes real echo command',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [Helpers.echo], deny: [], maxArgs: 5, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute(
      `${Helpers.echo} ${Helpers.echoArgs.join(' ')} hello world`,
      { cwd: tempDir, timeout: 5000 }
    )
    assertEquals(result.exitCode, 0)
    assert(result.stdout.includes('hello world'))
  }
)

Deno.test(
  'Terminal.execute - parses quoted arguments',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [Helpers.echo], deny: [], maxArgs: 5, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute(`${Helpers.echo} "hello world"`, {
      cwd: tempDir,
      timeout: 5000
    })
    assertEquals(result.exitCode, 0)
    assert(result.stdout.includes('hello world'))
  }
)

Deno.test(
  'Terminal.execute - respects timeout',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [Helpers.sleep], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    await assertRejects(async () => {
      await Terminal.execute(`${Helpers.sleep} 10`, { cwd: tempDir, timeout: 100 })
    }, Error)
  }
)

Deno.test(
  'Terminal.execute - throws on denied command',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [], deny: ['rm'], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('rm -rf /', { cwd: tempDir, timeout: 5000 }),
      Error,
      'Command not allowed'
    )
  }
)

Deno.test(
  'Terminal.execute - throws on invalid workspace',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const allowedDir = await Helpers.workspace('allowed')
    const otherDir = await Helpers.workspace('other')
    Terminal.initialize({
      workspaces: [allowedDir],
      commands: { allow: [Helpers.echo], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute(`${Helpers.echo} test`, { cwd: otherDir, timeout: 5000 }),
      Error,
      'Workspace validation failed'
    )
  }
)

Deno.test(
  'Terminal.execute - throws on too many args',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { maxArgs: 2, strictArgs: true, allow: [Helpers.echo], deny: [], noShell: true }
    })
    assertThrows(
      () => Terminal.execute(`${Helpers.echo} a b c d`, { cwd: tempDir, timeout: 5000 }),
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

Deno.test('Terminal.initialize - merges partial config', async () => {
  const tempDir = await Helpers.tempDir()
  Terminal.initialize({
    workspaces: [tempDir],
    commands: { allow: [Helpers.echo], deny: [], maxArgs: 10, strictArgs: true, noShell: true },
    timeout: 10000
  })
  const config = Terminal.getConfig()
  assertEquals(config.workspaces, [tempDir])
  assertEquals(config.timeout, 10000)
  assertEquals(config.commands.allow, [Helpers.echo])
})

Deno.test(
  'Terminal.kill - kills running process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [Helpers.sleep], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute(`${Helpers.sleep} 10`, {
      cwd: tempDir,
      background: true
    })
    assert(Terminal.kill(result.id))
    await new Promise(r => setTimeout(r, 500))
    assert(
      !Terminal.getList().find((p: { id: string; running?: boolean }) => p.id === result.id)
        ?.running
    )
  }
)

Deno.test('Terminal.kill - returns false for unknown process', () => {
  const result = Terminal.kill('nonexistent')
  assertEquals(result, false)
})

Deno.test('Terminal.setConfig - updates existing config', async () => {
  const initialDir = await Helpers.workspace('initial')
  const updatedDir = await Helpers.workspace('updated')
  Terminal.initialize({ workspaces: [initialDir] })
  Terminal.setConfig({ workspaces: [updatedDir], timeout: 5000 })
  const config = Terminal.getConfig()
  assertEquals(config.workspaces, [updatedDir])
  assertEquals(config.timeout, 5000)
})

Deno.test(
  'Terminal.stream - streams output from real process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    Terminal.initialize({
      workspaces: [tempDir],
      commands: { allow: [Helpers.echo], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute(
      `${Helpers.echo} ${Helpers.echoArgs.join(' ')} streamed`,
      { cwd: tempDir, background: true }
    )
    let received = ''
    Terminal.stream(
      result.id,
      (data: string) => {
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

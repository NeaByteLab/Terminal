import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert'
import Helpers from '@tests/helpers/index.ts'
import Terminal from '@app/index.ts'

const createConfig = (tempDir: string, allow: string[], maxArgs = 10) => ({
  workspaces: [tempDir],
  commands: {
    allow,
    deny: [],
    maxArgs,
    strictArgs: true,
    noShell: true
  }
})

const createExecuteOptions = (cwd: string, timeout = 5000, background = false) => ({
  cwd,
  timeout,
  background
})

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
    const config = createConfig(tempDir, [Helpers.sleep], 3)
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir, 5000, true)
    const result = await Terminal.execute(`${Helpers.sleep} 5`, executeOptions)
    assert(result.id.startsWith('term_'))
  }
)

Deno.test(
  'Terminal.execute - captures exit code',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.fail, Helpers.success])
    Terminal.initialize(config)
    const failExecuteOptions = createExecuteOptions(tempDir)
    const failResult = await Terminal.execute(
      `${Helpers.fail} ${Helpers.failArgs.join(' ')}`,
      failExecuteOptions
    )
    assertEquals(failResult.exitCode, 1)
    const successExecuteOptions = createExecuteOptions(tempDir)
    const successResult = await Terminal.execute(
      `${Helpers.success} ${Helpers.successArgs.join(' ')}`,
      successExecuteOptions
    )
    assertEquals(successResult.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - executes real echo command',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo], 5)
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(
      `${Helpers.echo} ${Helpers.echoArgs.join(' ')} hello world`,
      executeOptions
    )
    assertEquals(result.exitCode, 0)
    assert(Helpers.normalizeOutput(result.stdout).includes('hello world'))
  }
)

Deno.test(
  'Terminal.execute - parses quoted arguments',
  { sanitizeOps: false, sanitizeResources: false, ignore: Helpers.isWindows },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo], 5)
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} "hello world"`, executeOptions)
    assertEquals(result.exitCode, 0)
    assert(Helpers.normalizeOutput(result.stdout).includes('hello world'))
  }
)

Deno.test(
  'Terminal.execute - respects timeout',
  { sanitizeOps: false, sanitizeResources: false, ignore: Helpers.isWindows },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.sleep])
    Terminal.initialize(config)
    const executeOptions = { cwd: tempDir, timeout: 100 }
    await assertRejects(async () => {
      await Terminal.execute(`${Helpers.sleep} 10`, executeOptions)
    }, Error)
  }
)

Deno.test(
  'Terminal.execute - throws on denied command',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [],
        deny: ['rm'],
        maxArgs: 10,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    assertThrows(() => Terminal.execute('rm -rf /', executeOptions), Error, 'Command not allowed')
  }
)

Deno.test(
  'Terminal.execute - throws on invalid workspace',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const allowedDir = await Helpers.workspace('allowed')
    const otherDir = await Helpers.workspace('other')
    const config = createConfig(allowedDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(otherDir)
    assertThrows(
      () => Terminal.execute(`${Helpers.echo} test`, executeOptions),
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
    const config = {
      workspaces: [tempDir],
      commands: {
        maxArgs: 2,
        strictArgs: true,
        allow: [Helpers.echo],
        deny: [],
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    assertThrows(
      () => Terminal.execute(`${Helpers.echo} a b c d`, executeOptions),
      Error,
      'Too many arguments'
    )
  }
)

Deno.test('Terminal.getExitCode - returns null for unknown process', () => {
  const processId = 'nonexistent'
  const code = Terminal.getExitCode(processId)
  assertEquals(code, null)
})

Deno.test('Terminal.getList - returns process array', () => {
  const processList = Terminal.getList()
  assert(Array.isArray(processList))
})

Deno.test('Terminal.getOutput - returns empty for unknown process', () => {
  const processId = 'nonexistent'
  const expectedOutput = {
    stdout: '',
    stderr: ''
  }
  const output = Terminal.getOutput(processId)
  assertEquals(output, expectedOutput)
})

Deno.test('Terminal.initialize - merges partial config', async () => {
  const tempDir = await Helpers.tempDir()
  const initialConfig = {
    workspaces: [tempDir],
    commands: {
      allow: [Helpers.echo],
      deny: [],
      maxArgs: 10,
      strictArgs: true,
      noShell: true
    },
    timeout: 10000
  }
  Terminal.initialize(initialConfig)
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
    const config = createConfig(tempDir, [Helpers.sleep])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir, 5000, true)
    const result = await Terminal.execute(`${Helpers.sleep} 10`, executeOptions)
    assert(Terminal.kill(result.id))
    await new Promise(r => setTimeout(r, 500))
    assert(
      !Terminal.getList().find((p: { id: string; running?: boolean }) => p.id === result.id)
        ?.running
    )
  }
)

Deno.test('Terminal.kill - returns false for unknown process', () => {
  const processId = 'nonexistent'
  const result = Terminal.kill(processId)
  assertEquals(result, false)
})

Deno.test('Terminal.setConfig - updates existing config', async () => {
  const initialDir = await Helpers.workspace('initial')
  const updatedDir = await Helpers.workspace('updated')
  const initialConfig = { workspaces: [initialDir] }
  Terminal.initialize(initialConfig)
  const updatedConfig = { workspaces: [updatedDir], timeout: 5000 }
  Terminal.setConfig(updatedConfig)
  const config = Terminal.getConfig()
  assertEquals(config.workspaces, [updatedDir])
  assertEquals(config.timeout, 5000)
})

Deno.test(
  'Terminal.stream - streams output from real process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir, 5000, true)
    const result = await Terminal.execute(
      `${Helpers.echo} ${Helpers.echoArgs.join(' ')} streamed`,
      executeOptions
    )
    let received = ''
    const onData = (data: string) => {
      received += data
    }
    const onError = () => {}
    Terminal.stream(result.id, onData, onError)
    await new Promise(r => setTimeout(r, 500))
    assert(received.includes('streamed'))
  }
)

Deno.test('Terminal.stream - throws for unknown process', () => {
  const processId = 'unknown'
  const onData = () => {}
  const onError = () => {}
  assertThrows(() => Terminal.stream(processId, onData, onError), Error, 'Process not found')
})

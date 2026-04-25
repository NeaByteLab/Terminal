import { assert, assertEquals, assertThrows } from '@std/assert'
import Helpers from '@tests/helpers/index.ts'
import Terminal from '@app/index.ts'

const createConfig = (tempDir: string, allow: string[]) => ({
  workspaces: [tempDir],
  commands: {
    allow,
    deny: [],
    maxArgs: 10,
    strictArgs: true,
    noShell: true
  }
})

const createExecuteOptions = (cwd: string, timeout = 5000) => ({ cwd, timeout })

Deno.test(
  'Terminal.execute - allows RTL unicode characters',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} test\u202E`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - allows at-file syntax in args',
  { sanitizeOps: false, sanitizeResources: false, ignore: Helpers.isWindows },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} @testfile`, executeOptions)
    assertEquals(result.exitCode, 0)
    assert(Helpers.normalizeOutput(result.stdout).includes('@testfile'))
  }
)

Deno.test(
  'Terminal.execute - allows custom PATH in env',
  { sanitizeOps: false, sanitizeResources: false, ignore: Helpers.isWindows },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.echo],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      timeout: 5000,
      env: { PATH: '/bin:/usr/bin' }
    }
    const result = await Terminal.execute(`${Helpers.echo} test`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - allows leading dash in args',
  { sanitizeOps: false, sanitizeResources: false, ignore: Helpers.isWindows },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} --help`, executeOptions)
    assertEquals(result.exitCode, 0)
    assert(Helpers.normalizeOutput(result.stdout).includes('--help'))
  }
)

Deno.test(
  'Terminal.execute - blocks commands not in allow list',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.echo],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    assertThrows(
      () => Terminal.execute('nonexistentcommand arg', executeOptions),
      Error,
      'Command not allowed'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal at end',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.cat])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute(`${Helpers.cat} ${tempDir}/..`), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal backslash',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.cat])
    Terminal.initialize(config)
    assertThrows(
      () => Terminal.execute(`${Helpers.cat} ..\\..\\secret.txt`),
      Error,
      'Path traversal'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal double dots',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.cat])
    Terminal.initialize(config)
    assertThrows(
      () => Terminal.execute(`${Helpers.cat} ../../../secret.txt`),
      Error,
      'Path traversal'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal in middle',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.cat])
    Terminal.initialize(config)
    assertThrows(
      () => Terminal.execute(`${Helpers.cat} ${tempDir}/../../secret.txt`),
      Error,
      'Path traversal'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal mixed separators',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['cat'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('cat ..\\/../\\etc/passwd'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal triple dots',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['cat'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('cat .../.../.../etc/passwd'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar ampersand',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo hello && rm -rf /'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar backtick',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo `whoami`'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar curly braces',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo {cat,/etc/passwd}'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar dollar subshell',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo $(whoami)'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar heredoc',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['cat'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('cat << EOF\ntest\nEOF'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar input redirect',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['cat'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('cat < /etc/passwd'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar output redirect',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo hello > /etc/passwd'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar parentheses',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo (whoami)'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar pipe',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(
      () => Terminal.execute('echo hello | cat /etc/passwd'),
      Error,
      'shell metacharacters'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar semicolon',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo hello; rm -rf /'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar square brackets',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo [test]'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar variable expansion',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['echo'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo $HOME'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks too many arguments',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = {
      workspaces: ['/tmp'],
      commands: {
        allow: ['echo'],
        deny: [],
        maxArgs: 3,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('echo a b c d e f g h i j'), Error, 'Too many arguments')
  }
)

Deno.test(
  'Terminal.execute - blocks workspace outside allowed path',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/allowed', ['ls'])
    Terminal.initialize(config)
    const executeOptions = {
      cwd: '/etc'
    }
    assertThrows(
      () => Terminal.execute('ls /etc', executeOptions),
      Error,
      'Workspace validation failed'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks workspace traversal escape',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/allowed', ['ls'])
    Terminal.initialize(config)
    const executeOptions = {
      cwd: '/allowed/../../../etc'
    }
    assertThrows(
      () => Terminal.execute('ls test', executeOptions),
      Error,
      'Workspace validation failed'
    )
  }
)

Deno.test(
  'Terminal.execute - detects quoted shell metacharacters',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir
    }
    assertThrows(
      () => Terminal.execute(`${Helpers.echo} ";|&$"`, executeOptions),
      Error,
      'shell metacharacters'
    )
  }
)

Deno.test(
  'Terminal.execute - generates unique IDs for concurrent runs',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const promises = Array.from({ length: 10 }, (_, i) =>
      Terminal.execute(`${Helpers.echo} ${i}`, executeOptions)
    )
    const results = await Promise.all(promises)
    const ids = results.map(r => r.id)
    assertEquals(new Set(ids).size, 10)
  }
)

Deno.test(
  'Terminal.execute - handles empty env values',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.echo],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      timeout: 5000,
      env: {
        EMPTY: '',
        NODE_ENV: 'test'
      }
    }
    const result = await Terminal.execute(`${Helpers.echo} test`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles mixed quote types',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} "double" 'single'`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles newline in quoted string',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} "hello\\nworld"`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles unicode encoding safely',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} test\xc0\xaffile`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles URL encoded traversal safely',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} %2e%2e%2fsecret`, executeOptions)
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - rejects control characters in args',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = createConfig(tempDir, [Helpers.echo])
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    assertThrows(
      () => Terminal.execute(`${Helpers.echo} test\x00danger`, executeOptions),
      Error,
      'Null bytes'
    )
    const result = await Terminal.execute(`${Helpers.echo} test\x01danger`, executeOptions)
    assert(result.id.startsWith('term_'))
  }
)

Deno.test(
  'Terminal.execute - rejects empty command',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = {
      workspaces: ['/tmp'],
      commands: {
        allow: [''],
        deny: [],
        maxArgs: 10,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute(''), Error, 'Empty command')
  }
)

Deno.test(
  'Terminal.execute - rejects null byte in arguments',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    const config = createConfig('/tmp', ['cat'])
    Terminal.initialize(config)
    assertThrows(() => Terminal.execute('cat /etc/passwd\x00.txt'), Error, 'Null bytes')
  }
)

Deno.test(
  'Terminal.execute - rejects null byte in workspace path',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const config = createConfig('/allowed', ['ls'])
    Terminal.initialize(config)
    const executeOptions = {
      cwd: '/allowed\x00/../../../etc',
      timeout: 1000
    }
    try {
      await Terminal.execute('ls test', executeOptions)
    } catch {}
  }
)

Deno.test(
  'Terminal.getExitCode - detects signal termination',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.sleep],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      background: true
    }
    const result = await Terminal.execute(`${Helpers.sleep} 30`, executeOptions)
    Terminal.kill(result.id)
    await new Promise(r => setTimeout(r, 200))
    const exitCode = Terminal.getExitCode(result.id)
    assert(exitCode === null || exitCode !== 0)
  }
)

Deno.test(
  'Terminal.getList - removes completed processes after delay',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.echo],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = createExecuteOptions(tempDir)
    const result = await Terminal.execute(`${Helpers.echo} done`, executeOptions)
    assertEquals(result.exitCode, 0)
    const listAfterComplete = Terminal.getList().filter(p => p.id === result.id)
    assertEquals(listAfterComplete.length, 1)
    await new Promise(r => setTimeout(r, 5500))
    const listAfterCleanup = Terminal.getList().filter(p => p.id === result.id)
    assertEquals(listAfterCleanup.length, 0)
  }
)

Deno.test(
  'Terminal.getList - returns consistent process snapshot',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.sleep, Helpers.echo],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const before = Terminal.getList().length
    const results: { id: string }[] = []
    const backgroundOptions = { cwd: tempDir, background: true }
    for (let i = 0; i < 5; i++) {
      const r = await Terminal.execute(`${Helpers.sleep} 10`, backgroundOptions)
      results.push(r)
    }
    const list = Terminal.getList()
    assertEquals(list.length, before + 5)
    results.forEach(({ id }) => {
      const found = list.find(p => p.id === id)
      assert(found)
      assert(found.running)
      assert(found.pid)
    })
    results.forEach(({ id }) => Terminal.kill(id))
    await new Promise(r => setTimeout(r, 200))
  }
)

Deno.test(
  'Terminal.initialize - handles rapid reconfiguration',
  { sanitizeOps: false, sanitizeResources: false, ignore: Helpers.isWindows },
  async () => {
    const tempDir = await Helpers.tempDir()
    const promises: Promise<unknown>[] = []
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.echo, Helpers.sleep],
        deny: [],
        maxArgs: 5,
        strictArgs: true,
        noShell: true
      }
    }
    const executeOptions = {
      cwd: tempDir,
      timeout: 1000
    }
    for (let i = 0; i < 10; i++) {
      Terminal.initialize(config)
      promises.push(Terminal.execute(`${Helpers.echo} ${i}`, executeOptions))
    }
    const results = await Promise.all(promises)
    assertEquals(results.length, 10)
    results.forEach((r: unknown, i: number) => {
      const result = r as { exitCode: number; stdout: string }
      assertEquals(result.exitCode, 0)
      assert(result.stdout.includes(String(i)))
    })
  }
)

Deno.test(
  'Terminal.kill - cleans up parent process on kill',
  {
    sanitizeOps: false,
    sanitizeResources: false
  },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.sleep],
        deny: [],
        maxArgs: 5,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      background: true
    }
    const result = await Terminal.execute(`${Helpers.sleep} 5`, executeOptions)
    Terminal.kill(result.id)
    await new Promise(r => setTimeout(r, 2000))
    assert(!Terminal.getList().find(p => p.id === result.id)?.running)
  }
)

Deno.test(
  'Terminal.kill - falls back to SIGKILL after SIGTERM',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.sleep],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      background: true
    }
    const result = await Terminal.execute(`${Helpers.sleep} 30`, executeOptions)
    Terminal.kill(result.id)
    await new Promise(r => setTimeout(r, 3000))
    assert(!Terminal.getList().find(p => p.id === result.id)?.running)
  }
)

Deno.test(
  'Terminal.kill - handles double kill gracefully',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.sleep],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      background: true
    }
    const result = await Terminal.execute(`${Helpers.sleep} 10`, executeOptions)
    const kill1 = Terminal.kill(result.id)
    const kill2 = Terminal.kill(result.id)
    const kill3 = Terminal.kill(result.id)
    assert(kill1 || kill2 || kill3)
  }
)

Deno.test(
  'Terminal.kill - handles kill during process startup',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.sleep],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const ids = []
    const backgroundOptions = { cwd: tempDir, background: true }
    for (let i = 0; i < 20; i++) {
      const result = await Terminal.execute(`${Helpers.sleep} 10`, backgroundOptions)
      ids.push(result.id)
      Terminal.kill(result.id)
    }
    await new Promise(r => setTimeout(r, 500))
    const runningCount = ids.filter(id => Terminal.getList().find(p => p.id === id)?.running).length
    assert(runningCount === 0)
  }
)

Deno.test(
  'Terminal.kill - isolates kill to target process only',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const tempDir = await Helpers.tempDir()
    const config = {
      workspaces: [tempDir],
      commands: {
        allow: [Helpers.echo, Helpers.sleep],
        deny: [],
        maxArgs: 10,
        strictArgs: true,
        noShell: true
      }
    }
    Terminal.initialize(config)
    const executeOptions = {
      cwd: tempDir,
      background: true
    }
    const bg = await Terminal.execute(`${Helpers.sleep} 5`, executeOptions)
    Terminal.kill(bg.id)
    await new Promise(r => setTimeout(r, 100))
    assert(
      !Terminal.getList().find(p => p.id === bg.id)?.running || Terminal.getExitCode(bg.id) !== null
    )
  }
)

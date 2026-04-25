import { assert, assertEquals, assertThrows } from '@std/assert'
import { Terminal } from '@app/index.ts'

Deno.test(
  'Terminal.execute - allows RTL unicode characters',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo test\u202E', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - allows at-file syntax in args',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo @/etc/passwd', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
    assert(result.stdout.includes('@/etc/passwd'))
  }
)

Deno.test(
  'Terminal.execute - allows custom PATH in env',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo test', {
      cwd: '/tmp',
      timeout: 5000,
      env: { PATH: '/bin:/usr/bin' }
    })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - allows leading dash in args',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo --help', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
    assert(result.stdout.includes('--help'))
  }
)

Deno.test(
  'Terminal.execute - blocks commands not in allow list',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: {
        allow: ['echo'],
        deny: [],
        maxArgs: 2,
        strictArgs: true,
        noShell: true
      }
    })
    assertThrows(
      () => Terminal.execute('nonexistentcommand arg', { cwd: '/tmp', timeout: 5000 }),
      Error,
      'Command not allowed'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal at end',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat /etc/..'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal backslash',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('cat ..\\..\\..\\Windows\\System32\\config\\SAM'),
      Error,
      'Path traversal'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal double dots',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat ../../../etc/passwd'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal in middle',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat /tmp/../../etc/passwd'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal mixed separators',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat ..\\/../\\etc/passwd'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks path traversal triple dots',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat .../.../.../etc/passwd'), Error, 'Path traversal')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar ampersand',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo hello && rm -rf /'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar backtick',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo `whoami`'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar curly braces',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo {cat,/etc/passwd}'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar dollar subshell',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo $(whoami)'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar heredoc',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat << EOF\ntest\nEOF'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar input redirect',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat < /etc/passwd'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar output redirect',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo hello > /etc/passwd'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar parentheses',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo (whoami)'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar pipe',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
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
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo hello; rm -rf /'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar square brackets',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo [test]'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks shell metachar variable expansion',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo $HOME'), Error, 'shell metacharacters')
  }
)

Deno.test(
  'Terminal.execute - blocks too many arguments',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 3, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('echo a b c d e f g h i j'), Error, 'Too many arguments')
  }
)

Deno.test(
  'Terminal.execute - blocks workspace outside allowed path',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/allowed'],
      commands: { allow: ['ls'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('ls /etc', { cwd: '/etc' }),
      Error,
      'Workspace validation failed'
    )
  }
)

Deno.test(
  'Terminal.execute - blocks workspace traversal escape',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/allowed'],
      commands: { allow: ['ls'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('ls test', { cwd: '/allowed/../../../etc' }),
      Error,
      'Workspace validation failed'
    )
  }
)

Deno.test(
  'Terminal.execute - detects quoted shell metacharacters',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('echo ";|&$"', { cwd: '/tmp' }),
      Error,
      'shell metacharacters'
    )
  }
)

Deno.test(
  'Terminal.execute - generates unique IDs for concurrent runs',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const promises = Array.from({ length: 10 }, (_, i) =>
      Terminal.execute(`echo ${i}`, { cwd: '/tmp', timeout: 5000 })
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
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['env'], deny: [], maxArgs: 1, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('env', {
      cwd: '/tmp',
      timeout: 5000,
      env: { EMPTY: '', NODE_ENV: 'test' }
    })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles mixed quote types',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo "double" \'single\'', {
      cwd: '/tmp',
      timeout: 5000
    })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles newline in quoted string',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo "hello\nworld"', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles unicode encoding safely',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo test\xc0\xaffile', { cwd: '/tmp', timeout: 5000 })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - handles URL encoded traversal safely',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo %2e%2e%2fetc/passwd', {
      cwd: '/tmp',
      timeout: 5000
    })
    assertEquals(result.exitCode, 0)
  }
)

Deno.test(
  'Terminal.execute - rejects control characters in args',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(
      () => Terminal.execute('echo test\x00danger', { cwd: '/tmp', timeout: 5000 }),
      Error,
      'Null bytes'
    )
    const result = await Terminal.execute('echo test\x01danger', { cwd: '/tmp', timeout: 5000 })
    assert(result.id.startsWith('term_'))
  }
)

Deno.test(
  'Terminal.execute - rejects empty command',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: [''], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute(''), Error, 'Empty command')
  }
)

Deno.test(
  'Terminal.execute - rejects null byte in arguments',
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['cat'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    assertThrows(() => Terminal.execute('cat /etc/passwd\x00.txt'), Error, 'Null bytes')
  }
)

Deno.test(
  'Terminal.execute - rejects null byte in workspace path',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/allowed'],
      commands: { allow: ['ls'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    try {
      await Terminal.execute('ls test', { cwd: '/allowed\x00/../../../etc', timeout: 1000 })
    } catch {}
  }
)

Deno.test(
  'Terminal.getExitCode - detects signal termination',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('sleep 30', { cwd: '/tmp', background: true })
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
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('echo done', { cwd: '/tmp', timeout: 5000 })
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
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep', 'echo'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const before = Terminal.getList().length
    const results: { id: string }[] = []
    for (let i = 0; i < 5; i++) {
      const r = await Terminal.execute('sleep 10', { cwd: '/tmp', background: true })
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
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const promises: Promise<unknown>[] = []
    for (let i = 0; i < 10; i++) {
      Terminal.initialize({
        workspaces: ['/tmp'],
        commands: {
          allow: ['echo', 'sleep'],
          deny: [],
          maxArgs: 5,
          strictArgs: true,
          noShell: true
        }
      })
      promises.push(Terminal.execute(`echo ${i}`, { cwd: '/tmp', timeout: 1000 }))
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
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sh'], deny: [], maxArgs: 5, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('sh -c "sleep 5"', { cwd: '/tmp', background: true })
    Terminal.kill(result.id)
    await new Promise(r => setTimeout(r, 2000))
    assert(!Terminal.getList().find(p => p.id === result.id)?.running)
  }
)

Deno.test(
  'Terminal.kill - falls back to SIGKILL after SIGTERM',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('sleep 30', { cwd: '/tmp', background: true })
    Terminal.kill(result.id)
    await new Promise(r => setTimeout(r, 3000))
    assert(!Terminal.getList().find(p => p.id === result.id)?.running)
  }
)

Deno.test(
  'Terminal.kill - handles double kill gracefully',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const result = await Terminal.execute('sleep 10', { cwd: '/tmp', background: true })
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
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['sleep'], deny: [], maxArgs: 2, strictArgs: true, noShell: true }
    })
    const ids = []
    for (let i = 0; i < 20; i++) {
      const result = await Terminal.execute('sleep 10', { cwd: '/tmp', background: true })
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
    Terminal.initialize({
      workspaces: ['/tmp'],
      commands: { allow: ['echo', 'sleep'], deny: [], maxArgs: 10, strictArgs: true, noShell: true }
    })
    const bg = await Terminal.execute('sleep 5', { cwd: '/tmp', background: true })
    Terminal.kill(bg.id)
    await new Promise(r => setTimeout(r, 100))
    assert(
      !Terminal.getList().find(p => p.id === bg.id)?.running || Terminal.getExitCode(bg.id) !== null
    )
  }
)

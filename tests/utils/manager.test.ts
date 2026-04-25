import { assert, assertEquals } from '@std/assert'
import { spawn } from 'node:child_process'
import Helpers from '@tests/helpers/index.ts'
import * as Utils from '@app/utils/index.ts'

Deno.test(
  'Utils.Manager.appendOutput - appends to stderr',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.echo, [...Helpers.echoArgs, 'test'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: 'test',
      args: [],
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: 'error',
      abortController,
      process: childProcess
    })
    Utils.Manager.appendOutput(id, undefined, ' more')
    const output = Utils.Manager.getProcessOutput(id)
    assertEquals(output.stderr, 'error more')
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test(
  'Utils.Manager.appendOutput - appends to stdout',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.echo, [...Helpers.echoArgs, 'test'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: 'test',
      args: [],
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: 'initial',
      stderr: '',
      abortController,
      process: childProcess
    })
    Utils.Manager.appendOutput(id, ' more', undefined)
    const output = Utils.Manager.getProcessOutput(id)
    assertEquals(output.stdout, 'initial more')
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test('Utils.Manager.appendOutput - ignores unknown id', () => {
  Utils.Manager.appendOutput('unknown', 'data', undefined)
})

Deno.test('Utils.Manager.generateProcessId - unique format', () => {
  const id1 = Utils.Manager.generateProcessId()
  const id2 = Utils.Manager.generateProcessId()
  assert(id1.startsWith('term_'))
  assert(id1.includes('_'))
  assert(id1 !== id2)
})

Deno.test(
  'Utils.Manager.getAllProcesses - returns array',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const before = Utils.Manager.getAllProcesses().length
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.echo, [...Helpers.echoArgs, 'test'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: 'test',
      args: [],
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    const after = Utils.Manager.getAllProcesses().length
    assertEquals(after, before + 1)
    assert(Utils.Manager.getAllProcesses().some(p => p.id === id))
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test('Utils.Manager.getProcess - returns undefined for unknown', () => {
  const result = Utils.Manager.getProcess('nonexistent')
  assertEquals(result, undefined)
})

Deno.test(
  'Utils.Manager.getProcessExitCode - null when running',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.sleep, Helpers.sleepArgs(1), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: Helpers.sleep,
      args: Helpers.sleepArgs(1),
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    const code = Utils.Manager.getProcessExitCode(id)
    assertEquals(code, null)
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test(
  'Utils.Manager.getProcessList - includes running processes',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.sleep, Helpers.sleepArgs(2), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: Helpers.sleep,
      args: Helpers.sleepArgs(2),
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    const list = Utils.Manager.getProcessList()
    assert(list.some(p => p.id === id))
    assert(list.find(p => p.id === id)?.running)
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test(
  'Utils.Manager.getProcessOutput - captures stdout and stderr',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.echo, [...Helpers.echoArgs, 'hello'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.generateProcessId()
    Utils.Manager.registerProcess({
      id,
      command: Helpers.echo,
      args: [...Helpers.echoArgs, 'hello'],
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: 0,
      signal: null,
      stdout: 'hello\n',
      stderr: 'warning',
      abortController,
      process: childProcess
    })
    const output = Utils.Manager.getProcessOutput(id)
    assertEquals(output.stdout, 'hello\n')
    assertEquals(output.stderr, 'warning')
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test('Utils.Manager.getProcessOutput - empty for unknown id', () => {
  const output = Utils.Manager.getProcessOutput('unknown')
  assertEquals(output, { stdout: '', stderr: '' })
})

Deno.test('Utils.Manager.isProcessRunning - false for unknown', () => {
  assert(!Utils.Manager.isProcessRunning('unknown'))
})

Deno.test(
  'Utils.Manager.isProcessRunning - true when active',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.sleep, Helpers.sleepArgs(1), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: Helpers.sleep,
      args: Helpers.sleepArgs(1),
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    assert(Utils.Manager.isProcessRunning(id))
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test(
  'Utils.Manager.killProcess - kills real process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.sleep, Helpers.sleepArgs(10), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: Helpers.sleep,
      args: Helpers.sleepArgs(10),
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    assert(Utils.Manager.killProcess(id))
    await new Promise(r => setTimeout(r, 500))
    assert(!Utils.Manager.isProcessRunning(id))
  }
)

Deno.test('Utils.Manager.killProcess - returns false for unknown', () => {
  const result = Utils.Manager.killProcess('unknown')
  assertEquals(result, false)
})

Deno.test(
  'Utils.Manager.registerProcess - assigns id and stores real process',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.echo, [...Helpers.echoArgs, 'hello'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: Helpers.echo,
      args: [...Helpers.echoArgs, 'hello'],
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    assert(id.startsWith('term_'))
    const retrieved = Utils.Manager.getProcess(id)
    assertEquals(retrieved?.command, Helpers.echo)
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test(
  'Utils.Manager.registerProcess - custom id respected',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.echo, [...Helpers.echoArgs, 'test'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const customId = 'custom_test_id'
    const id = Utils.Manager.registerProcess({
      id: customId,
      command: Helpers.echo,
      args: [...Helpers.echoArgs, 'test'],
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    assertEquals(id, customId)
    Utils.Manager.killProcess(id)
    await new Promise(r => setTimeout(r, 100))
  }
)

Deno.test('Utils.Manager.setProcessTimeout - ignores unknown id', () => {
  Utils.Manager.setProcessTimeout('unknown', 1000)
})

Deno.test(
  'Utils.Manager.setProcessTimeout - kills after timeout',
  { sanitizeOps: false, sanitizeResources: false },
  async () => {
    const abortController = new AbortController()
    const tempDir = await Helpers.tempDir()
    const childProcess = spawn(Helpers.sleep, Helpers.sleepArgs(10), {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    const id = Utils.Manager.registerProcess({
      command: Helpers.sleep,
      args: Helpers.sleepArgs(10),
      cwd: tempDir,
      startTime: new Date(),
      background: false,
      exitCode: null,
      signal: null,
      stdout: '',
      stderr: '',
      abortController,
      process: childProcess
    })
    Utils.Manager.setProcessTimeout(id, 100)
    await new Promise(r => setTimeout(r, 500))
    assert(!Utils.Manager.isProcessRunning(id))
  }
)

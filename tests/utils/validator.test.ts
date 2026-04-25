import { assert, assertEquals } from '@std/assert'
import * as Utils from '@app/utils/index.ts'

Deno.test('Utils.Validator.filterEnvironment - allow list only', () => {
  const env = { NODE_ENV: 'test', PATH: '/bin', HOME: '/root', SECRET: 'value' }
  const result = Utils.Validator.filterEnvironment(env, ['NODE_ENV', 'PATH'], [])
  assertEquals(result, { NODE_ENV: 'test', PATH: '/bin' })
})

Deno.test('Utils.Validator.filterEnvironment - deny list blocks', () => {
  const env = { SAFE: 'yes', SECRET: 'no', SSH_KEY: 'private' }
  const result = Utils.Validator.filterEnvironment(env, [], ['SECRET', 'SSH_*'])
  assertEquals(result, { SAFE: 'yes' })
})

Deno.test('Utils.Validator.filterEnvironment - deny overrides allow', () => {
  const env = { BOTH: 'value' }
  const result = Utils.Validator.filterEnvironment(env, ['BOTH'], ['BOTH'])
  assertEquals(result, {})
})

Deno.test('Utils.Validator.filterEnvironment - undefined values excluded', () => {
  const env: Record<string, string | undefined> = { DEFINED: 'value', UNDEFINED: undefined }
  const result = Utils.Validator.filterEnvironment(env, ['DEFINED', 'UNDEFINED'], [])
  assertEquals(result, { DEFINED: 'value' })
})

Deno.test('Utils.Validator.hasPathTraversal - detects traversal patterns', () => {
  assert(Utils.Validator.hasPathTraversal('../etc/passwd'))
  assert(Utils.Validator.hasPathTraversal('..\\Windows\\System32'))
  assert(Utils.Validator.hasPathTraversal('/path/..'))
})

Deno.test('Utils.Validator.hasPathTraversal - safe paths pass', () => {
  assert(!Utils.Validator.hasPathTraversal('/safe/path'))
  assert(!Utils.Validator.hasPathTraversal('./relative/path'))
  assert(!Utils.Validator.hasPathTraversal('single/dots/file.txt'))
})

Deno.test('Utils.Validator.validateArguments - exceeds maxArgs', () => {
  const result = Utils.Validator.validateArguments(['a', 'b', 'c'], 2, true)
  assert(!result.valid)
  assertEquals(result.error, 'Too many arguments: 3 > max 2')
})

Deno.test('Utils.Validator.validateArguments - non-strict allows metachars', () => {
  const result = Utils.Validator.validateArguments(['test;danger'], 10, false)
  assert(result.valid)
})

Deno.test('Utils.Validator.validateArguments - path traversal detected', () => {
  const result = Utils.Validator.validateArguments(['../../etc/passwd'], 10, true)
  assert(!result.valid)
  assert(result.error?.includes('Path traversal'))
})

Deno.test('Utils.Validator.validateArguments - within maxArgs', () => {
  const result = Utils.Validator.validateArguments(['arg1', 'arg2'], 5, true)
  assert(result.valid)
})

Deno.test('Utils.Validator.validateCommand - allowed command', () => {
  const config = {
    maxArgs: 10,
    strictArgs: true,
    noShell: true,
    allow: ['echo', 'cat'],
    deny: []
  }
  assert(Utils.Validator.validateCommand('echo', config))
  assert(Utils.Validator.validateCommand('cat', config))
})

Deno.test('Utils.Validator.validateCommand - denied command', () => {
  const config = {
    maxArgs: 10,
    strictArgs: true,
    noShell: true,
    allow: [],
    deny: ['rm', 'sudo']
  }
  assert(!Utils.Validator.validateCommand('rm', config))
  assert(!Utils.Validator.validateCommand('sudo', config))
})

Deno.test('Utils.Validator.validateCommand - deny overrides allow', () => {
  const config = {
    maxArgs: 10,
    strictArgs: true,
    noShell: true,
    allow: ['*'],
    deny: ['rm']
  }
  assert(Utils.Validator.validateCommand('echo', config))
  assert(!Utils.Validator.validateCommand('rm', config))
})

Deno.test('Utils.Validator.validateCommand - wildcard pattern', () => {
  const config = {
    maxArgs: 10,
    strictArgs: true,
    noShell: true,
    allow: ['git*', 'node*'],
    deny: []
  }
  assert(Utils.Validator.validateCommand('git', config))
  assert(Utils.Validator.validateCommand('git-status', config))
  assert(Utils.Validator.validateCommand('node', config))
  assert(Utils.Validator.validateCommand('node-v20', config))
})

Deno.test('Utils.Validator.validateWorkspace - allowed workspace', () => {
  const result = Utils.Validator.validateWorkspace('/workspace1/project', ['/workspace1'])
  assert(result.valid)
  assertEquals(result.resolvedPath, '/workspace1/project')
})

Deno.test('Utils.Validator.validateWorkspace - empty workspaces allows any', () => {
  const result = Utils.Validator.validateWorkspace('/any/path', [])
  assert(result.valid)
  assertEquals(result.resolvedPath, '/any/path')
})

Deno.test('Utils.Validator.validateWorkspace - nested path allowed', () => {
  const result = Utils.Validator.validateWorkspace('/workspace1/a/b/c', ['/workspace1'])
  assert(result.valid)
})

Deno.test('Utils.Validator.validateWorkspace - path outside workspace', () => {
  const result = Utils.Validator.validateWorkspace('/malicious/path', ['/workspace1'])
  assert(!result.valid)
  assert(result.error?.includes('Workspace not allowed'))
})

Deno.test('Utils.Validator.validateWorkspace - undefined cwd uses first workspace', () => {
  const result = Utils.Validator.validateWorkspace(undefined, ['/workspace1', '/workspace2'])
  assert(result.valid)
  assertEquals(result.resolvedPath, '/workspace1')
})
